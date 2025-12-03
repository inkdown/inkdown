/**
 * WindowConfigManager - Manages window appearance settings
 * 
 * Handles configuration for native vs custom window decorations.
 * Requires app restart to apply changes.
 */

import type { App } from '../App';

/**
 * Window configuration interface
 */
export interface WindowConfig {
    /** Whether to use custom window decorations (false = native) */
    customTitleBar: boolean;
}

/**
 * Default window configuration
 */
export const DEFAULT_WINDOW_CONFIG: WindowConfig = {
    customTitleBar: false,
};

/**
 * Manages window appearance settings
 */
export class WindowConfigManager {
    private config: WindowConfig = DEFAULT_WINDOW_CONFIG;
    private configLoaded = false;

    constructor(private app: App) {}

    /**
     * Load configuration from window.json
     */
    async loadConfig(): Promise<WindowConfig> {
        if (this.configLoaded) {
            return this.config;
        }

        try {
            const config = await this.app.configManager.loadConfig<WindowConfig>('window');
            if (config) {
                this.config = { ...DEFAULT_WINDOW_CONFIG, ...config };
            }
            this.configLoaded = true;
        } catch (error) {
            console.error('Failed to load window config:', error);
        }

        return this.config;
    }

    /**
     * Get current configuration (loads if not already loaded)
     */
    async getConfig(): Promise<WindowConfig> {
        if (!this.configLoaded) {
            await this.loadConfig();
        }
        return this.config;
    }

    /**
     * Check if custom title bar is enabled
     */
    async isCustomTitleBarEnabled(): Promise<boolean> {
        const config = await this.getConfig();
        return config.customTitleBar;
    }

    /**
     * Update configuration
     * Note: Changes require app restart to take effect
     */
    async saveConfig(config: Partial<WindowConfig>): Promise<void> {
        this.config = { ...this.config, ...config };
        await this.app.configManager.saveConfig('window', this.config);
    }

    /**
     * Toggle custom title bar setting
     * Returns true if the setting was changed (restart needed)
     */
    async toggleCustomTitleBar(enabled: boolean): Promise<boolean> {
        const currentConfig = await this.getConfig();
        if (currentConfig.customTitleBar === enabled) {
            return false;
        }
        
        await this.saveConfig({ customTitleBar: enabled });
        return true;
    }
}
