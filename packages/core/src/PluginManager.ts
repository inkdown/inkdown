import type { App } from './App';
import type { PluginSettingTab } from './components/PluginSettingTab';
import type { Plugin } from './Plugin';
import type { PluginManifest } from './types/plugin';
import { createLogger } from './utils/logger';

/**
 * Plugin registration info with manifest
 * Desktop app provides plugin implementations with their manifests
 */
export interface PluginInfo {
    /** Plugin manifest with metadata */
    manifest: PluginManifest;
    /** Whether this is a built-in plugin from @inkdown/plugins */
    isBuiltIn?: boolean;
    /** Async loader function that returns the plugin class */
    loader: () => Promise<{
        default: new (app: App, manifest: PluginManifest) => Plugin;
    }>;
}

/**
 * Plugin configuration stored in app.json
 */
export interface PluginConfig {
    id: string;
    enabled: boolean;
    settings?: Record<string, any>;
}

/** Plugin change event types */
export type PluginChangeType = 'enabled' | 'disabled' | 'settings-changed';

/** Plugin change listener */
export type PluginChangeListener = (pluginId: string, changeType: PluginChangeType) => void;

/**
 * PluginManager - Manages loading, enabling, and disabling of plugins
 * Stores plugin configurations in app.json under "plugins" key
 */
export class PluginManager {
    private app: App;
    private logger = createLogger('PluginManager');
    private plugins: Map<string, Plugin> = new Map();
    private enabledPlugins: Set<string> = new Set();
    private registeredPlugins: Map<string, PluginInfo> = new Map();
    private builtInPluginIds: Set<string> = new Set();
    private pluginConfigs: Map<string, PluginConfig> = new Map();
    private changeListeners: Set<PluginChangeListener> = new Set();

    constructor(app: App) {
        this.app = app;
    }

    /**
     * Register a listener for plugin changes (enable/disable/settings)
     * Returns an unsubscribe function
     */
    onPluginChange(listener: PluginChangeListener): () => void {
        this.changeListeners.add(listener);
        return () => this.changeListeners.delete(listener);
    }

    /**
     * Notify all listeners of a plugin change
     */
    private notifyChange(pluginId: string, changeType: PluginChangeType): void {
        for (const listener of this.changeListeners) {
            try {
                listener(pluginId, changeType);
            } catch (error) {
                this.logger.error('Plugin change listener error', error);
            }
        }
    }

    /**
     * Register a plugin with its manifest
     * @param info Plugin registration info including manifest and loader
     */
    registerPlugin(info: PluginInfo): void {
        this.registeredPlugins.set(info.manifest.id, info);
        if (info.isBuiltIn) {
            this.builtInPluginIds.add(info.manifest.id);
        }
    }

    /**
     * Check if a plugin is built-in
     */
    isBuiltIn(pluginId: string): boolean {
        return this.builtInPluginIds.has(pluginId);
    }

    /**
     * Load all plugins (built-in and custom)
     */
    async loadAllPlugins(): Promise<void> {
        // Load plugin configs from app.json
        await this.loadPluginConfigs();

        // Load all registered plugins
        await this.loadRegisteredPlugins();

        this.logger.info('Plugin system ready');
    }

    /**
     * Load plugin configurations from app.json
     */
    private async loadPluginConfigs(): Promise<void> {
        try {
            const appConfig = await this.app.configManager.loadConfig<{ plugins?: PluginConfig[] }>(
                'app',
            );
            if (appConfig?.plugins) {
                this.logger.info(
                    `Loading ${appConfig.plugins.length} plugin configs from app.json`,
                );
                for (const config of appConfig.plugins) {
                    this.pluginConfigs.set(config.id, config);
                    this.logger.debug(`Loaded config for ${config.id}: enabled=${config.enabled}`);
                }
            } else {
                this.logger.info('No saved plugin configs found, will use defaults');
            }
        } catch (error) {
            this.logger.warn('Failed to load plugin configs', error);
        }
    }

    /**
     * Save plugin configurations to app.json
     */
    private async savePluginConfigs(): Promise<void> {
        try {
            const appConfig =
                (await this.app.configManager.loadConfig<Record<string, any>>('app')) || {};
            const pluginConfigsArray = Array.from(this.pluginConfigs.values());

            this.logger.info(`💾 Saving ${pluginConfigsArray.length} plugin configs...`);
            pluginConfigsArray.forEach((config) => {
                this.logger.debug(`  - ${config.id}: enabled=${config.enabled}`);
            });

            appConfig.plugins = pluginConfigsArray;
            await this.app.configManager.saveConfig('app', appConfig);

            this.logger.info('✅ Plugin configs saved successfully');
        } catch (error) {
            this.logger.error('❌ Failed to save plugin configs', error);
        }
    }

    /**
     * Get or create plugin config
     */
    private getOrCreateConfig(pluginId: string, isBuiltIn = false): PluginConfig {
        let config = this.pluginConfigs.get(pluginId);
        if (config) {
            this.logger.debug(`Using existing config for ${pluginId}: enabled=${config.enabled}`);
        } else {
            // ✅ FIX: Built-in plugins enabled by default, user plugins disabled
            // This prevents the issue where disabled plugins appear enabled after reload
            // while ensuring built-in plugins work out of the box
            const defaultEnabled = isBuiltIn;
            config = { id: pluginId, enabled: defaultEnabled, settings: {} };
            this.pluginConfigs.set(pluginId, config);
            this.logger.info(
                `Created new config for ${pluginId} with enabled=${defaultEnabled} (built-in=${isBuiltIn})`,
            );
        }
        return config;
    }

    /**
     * Load all registered plugins
     */
    private async loadRegisteredPlugins(): Promise<void> {
        this.logger.info(`Loading ${this.registeredPlugins.size} registered plugins`);

        for (const [id, info] of this.registeredPlugins.entries()) {
            try {
                const PluginClass = (await info.loader()).default;
                const plugin = new PluginClass(this.app, info.manifest);
                this.plugins.set(id, plugin);

                // Check if plugin should be enabled
                const config = this.getOrCreateConfig(id, info.isBuiltIn);
                if (config.enabled) {
                    this.logger.info(`Enabling plugin ${id} (from saved config)`);
                    await this.enablePlugin(id, false); // Don't save during initial load
                } else {
                    this.logger.debug(`Plugin ${id} will remain disabled`);
                }
            } catch (error) {
                this.logger.error(`Failed to load plugin ${id}`, error);
            }
        }

        // Save configs after initial load to persist any new plugins
        this.logger.info('Saving plugin configs after initial load');
        await this.savePluginConfigs();
    }

    /**
     * Enable a plugin
     * @param pluginId Plugin ID to enable
     * @param save Whether to save config (default true, false during initial load)
     */
    async enablePlugin(pluginId: string, save = true): Promise<void> {
        const plugin = this.plugins.get(pluginId);
        if (!plugin) {
            this.logger.error(`Plugin ${pluginId} not found`);
            return;
        }

        if (plugin.enabled) {
            this.logger.warn(`Plugin ${pluginId} is already enabled`);
            return;
        }

        try {
            await plugin.onload();
            plugin.enabled = true;
            this.enabledPlugins.add(pluginId);

            // Update config
            const config = this.getOrCreateConfig(pluginId);
            config.enabled = true;

            if (save) {
                this.logger.info(`📝 Saving plugin config for ${pluginId} (enabled=true)...`);
                await this.savePluginConfigs();
            } else {
                this.logger.debug(`⏭️ Skipping save for ${pluginId} (initial load)`);
            }

            // Notify listeners
            this.notifyChange(pluginId, 'enabled');

            this.logger.info(`✅ Plugin ${pluginId} enabled`);
        } catch (error) {
            this.logger.error(`Failed to enable plugin ${pluginId}`, error);
            throw error;
        }
    }

    /**
     * Disable a plugin
     */
    async disablePlugin(pluginId: string): Promise<void> {
        const plugin = this.plugins.get(pluginId);
        if (!plugin) {
            this.logger.error(`Plugin ${pluginId} not found`);
            return;
        }

        if (!plugin.enabled) {
            this.logger.warn(`Plugin ${pluginId} is already disabled`);
            return;
        }

        try {
            await plugin.onunload();
            await plugin._cleanup();
            plugin.enabled = false;
            this.enabledPlugins.delete(pluginId);

            // Update config
            const config = this.getOrCreateConfig(pluginId);
            config.enabled = false;

            this.logger.info(`📝 Saving plugin config for ${pluginId} (enabled=false)...`);
            await this.savePluginConfigs();

            // Notify listeners
            this.notifyChange(pluginId, 'disabled');

            this.logger.info(`✅ Plugin ${pluginId} disabled`);
        } catch (error) {
            this.logger.error(`Failed to disable plugin ${pluginId}`, error);
            throw error;
        }
    }

    /**
     * Toggle a plugin's enabled state
     */
    async togglePlugin(pluginId: string): Promise<boolean> {
        const plugin = this.plugins.get(pluginId);
        if (!plugin) {
            this.logger.error(`Plugin ${pluginId} not found`);
            return false;
        }

        if (plugin.enabled) {
            await this.disablePlugin(pluginId);
            return false;
        }
        await this.enablePlugin(pluginId);
        return true;
    }

    /**
     * Get plugin settings
     */
    getPluginSettings<T = Record<string, any>>(pluginId: string): T | undefined {
        const config = this.pluginConfigs.get(pluginId);
        return config?.settings as T | undefined;
    }

    /**
     * Save plugin settings
     */
    async savePluginSettings(pluginId: string, settings: Record<string, any>): Promise<void> {
        const config = this.getOrCreateConfig(pluginId);
        config.settings = settings;
        await this.savePluginConfigs();
        this.notifyChange(pluginId, 'settings-changed');
    }

    /**
     * Get a plugin by ID
     */
    getPlugin(pluginId: string): Plugin | undefined {
        return this.plugins.get(pluginId);
    }

    /**
     * Get all plugins
     */
    getAllPlugins(): Plugin[] {
        return Array.from(this.plugins.values());
    }

    /**
     * Get all enabled plugins
     */
    getEnabledPlugins(): Plugin[] {
        return Array.from(this.plugins.values()).filter((p) => p.enabled);
    }

    /**
     * Check if a plugin is enabled
     */
    isPluginEnabled(pluginId: string): boolean {
        return this.enabledPlugins.has(pluginId);
    }

    /**
     * Unload all plugins
     */
    async unloadAllPlugins(): Promise<void> {
        for (const plugin of this.plugins.values()) {
            if (plugin.enabled) {
                await this.disablePlugin(plugin.manifest.id);
            }
        }
        this.plugins.clear();
        this.enabledPlugins.clear();
    }

    /**
     * Get all setting tabs from all enabled plugins
     */
    getAllSettingTabs(): Array<PluginSettingTab & { pluginId: string }> {
        const tabs: Array<PluginSettingTab & { pluginId: string }> = [];

        for (const plugin of this.plugins.values()) {
            if (plugin.enabled) {
                const pluginTabs = plugin.getSettingTabs();
                for (const tab of pluginTabs) {
                    tabs.push(Object.assign(tab, { pluginId: plugin.manifest.id }));
                }
            }
        }

        return tabs;
    }
}
