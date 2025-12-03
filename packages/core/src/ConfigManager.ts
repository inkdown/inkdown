import { invoke } from '@tauri-apps/api/core';
import { createLogger } from './utils/logger';

/**
 * ConfigManager - Manages application configuration
 * Uses hybrid cache strategy: localStorage first, then JSON files
 */
export class ConfigManager {
    private configDir = '';
    private cache: Map<string, any> = new Map();
    private readonly CACHE_PREFIX = 'inkdown_config_';
    private logger = createLogger('ConfigManager');

    constructor() {
        // Config manager is ready
    }

    /**
     * Initialize the config manager
     * Gets the config directory from Tauri
     */
    async init(): Promise<void> {
        try {
            this.configDir = await invoke<string>('get_config_dir');
            this.logger.info(`Config directory: ${this.configDir}`);
        } catch (error) {
            this.logger.error('Failed to get config directory', error);
            // Fallback to a default path
            this.configDir = '.inkdown';
        }
    }

    /**
     * Load configuration
     * Strategy: Try localStorage first, then file, then default
     */
    async loadConfig<T>(configName: string): Promise<T> {
        // 1. Try to load from cache (localStorage) - fastest
        const cached = this.loadFromCache<T>(configName);
        if (cached !== null) {
            /*             this.logger.debug(`Loaded ${configName} from localStorage cache`); */
            // Debug: log tabs if it's app config
            if (configName === 'app' && (cached as any).tabs) {
                this.logger.debug(`Cached tabs: ${(cached as any).tabs?.length || 0}`);
            }
            return cached;
        }

        // 2. Try to load from file - persistent
        try {
            const fileData = await this.loadFromFile<T>(configName);
            // Save to cache for next time
            this.saveToCache(configName, fileData);
            /*             this.logger.info(`Loaded ${configName} from file, cached to localStorage`); */
            return fileData;
        } catch (error) {
            this.logger.info(`No existing ${configName}.json file, creating with defaults`);
        }

        // 3. Create default config (first time setup)
        const defaultConfig = this.getDefaultConfig<T>(configName);

        // Save to both cache and file
        this.saveToCache(configName, defaultConfig);

        try {
            await this.saveToFile(configName, defaultConfig);
            this.logger.info(`Created ${configName}.json with defaults`);
        } catch (error) {
            this.logger.error(`Failed to create ${configName}.json`, error);
            // Continue anyway with cached version
        }

        return defaultConfig;
    }

    /**
     * Save configuration
     * Saves to both cache and file
     */
    async saveConfig<T>(configName: string, data: T): Promise<void> {
        // Debug: log tabs if it's app config
        if (configName === 'app') {
            this.logger.debug(`Saving app config with tabs: ${(data as any).tabs?.length || 0}`);
            this.logger.debug('Tabs data:', JSON.stringify((data as any).tabs, null, 2));
        }

        // Save to cache
        this.saveToCache(configName, data);
        this.logger.debug(`✅ Saved ${configName} to localStorage cache`);

        // Save to file
        try {
            await this.saveToFile(configName, data);
            this.logger.info(`✅ Saved ${configName} to file successfully`);
        } catch (error) {
            this.logger.error(`❌ Failed to save ${configName} to file:`, error);
            throw error;
        }
    }

    /**
     * Load from localStorage cache
     */
    private loadFromCache<T>(key: string): T | null {
        try {
            const cacheKey = this.CACHE_PREFIX + key;
            const cached = localStorage.getItem(cacheKey);
            if (cached) {
                return JSON.parse(cached) as T;
            }
        } catch (error) {
            this.logger.error(`Failed to load ${key} from cache`, error);
        }
        return null;
    }

    /**
     * Save to localStorage cache
     */
    private saveToCache<T>(key: string, data: T): void {
        try {
            const cacheKey = this.CACHE_PREFIX + key;
            localStorage.setItem(cacheKey, JSON.stringify(data));
        } catch (error) {
            this.logger.error(`Failed to save ${key} to cache`, error);
        }
    }

    /**
     * Load from JSON file via Tauri
     */
    private async loadFromFile<T>(configName: string): Promise<T> {
        const fileName = `${configName}.json`;
        try {
            const content = await invoke<string>('read_config_file', { fileName });
            return JSON.parse(content) as T;
        } catch (error) {
            this.logger.error(`Failed to load ${fileName}`, error);
            throw error;
        }
    }

    /**
     * Save to JSON file via Tauri
     */
    private async saveToFile<T>(configName: string, data: T): Promise<void> {
        const fileName = `${configName}.json`;
        const content = JSON.stringify(data, null, 2);
        try {
            this.logger.debug(`📝 Writing ${fileName} (${content.length} bytes)...`);
            await invoke('write_config_file', { fileName, content });
            this.logger.debug(`✅ Successfully wrote ${fileName} to disk`);
        } catch (error) {
            this.logger.error(`❌ Failed to write ${fileName}:`, error);
            throw error;
        }
    }

    /**
     * Get default configuration for a config name
     */
    private getDefaultConfig<T>(configName: string): T {
        const defaults: Record<string, any> = {
            app: {
                version: '1.0.0',
                tabs: [],
                workspace: '', // User's selected workspace path
                theme: 'default-dark',
                colorScheme: 'dark',
                font: {
                    family: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                    size: 16,
                },
                enabledPlugins: [],
            },
            // Shortcuts config only stores USER OVERRIDES, not all shortcuts
            // Default shortcuts are defined in ShortcutManager.DEFAULT_SHORTCUTS
            shortcuts: {
                shortcuts: {},
            },
            // Editor configuration
            editor: {
                autoPairBrackets: true,
                tabIndentation: true,
                convertPastedHtmlToMarkdown: true,
                vimMode: false,
            },
        };

        return (defaults[configName] || {}) as T;
    }

    /**
     * Clear cache for a specific config
     */
    clearCache(configName: string): void {
        const cacheKey = this.CACHE_PREFIX + configName;
        localStorage.removeItem(cacheKey);
        this.cache.delete(configName);
    }

    /**
     * Clear all caches
     */
    clearAllCaches(): void {
        // Clear localStorage
        const keys = Object.keys(localStorage);
        for (const key of keys) {
            if (key.startsWith(this.CACHE_PREFIX)) {
                localStorage.removeItem(key);
            }
        }
        // Clear memory cache
        this.cache.clear();
    }

    /**
     * Save all configs (called on app close)
     */
    async saveAllConfigs(): Promise<void> {
        // This will be called by App on cleanup
        // Individual configs are saved immediately, so this is mostly a safety net
        console.log('All configs saved');
    }
}
