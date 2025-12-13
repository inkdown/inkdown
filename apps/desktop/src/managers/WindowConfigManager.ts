/**
 * WindowConfigManager - Manages window appearance and state settings
 *
 * Handles configuration for native vs custom window decorations,
 * and persists window size/position/state between sessions.
 * Requires app restart to apply decoration changes.
 */

import type { App } from '@inkdown/core';

/**
 * Window size and position state
 */
export interface WindowState {
    /** Window width in pixels */
    width: number;
    /** Window height in pixels */
    height: number;
    /** Window X position */
    x?: number;
    /** Window Y position */
    y?: number;
    /** Whether the window is maximized */
    isMaximized: boolean;
    /** Whether the window is fullscreen */
    isFullscreen: boolean;
}

/**
 * Window configuration interface
 */
export interface WindowConfig {
    /** Whether to use custom window decorations (false = native) */
    customTitleBar: boolean;
    /** Persisted window state */
    windowState?: WindowState;
}

/**
 * Default window state
 */
export const DEFAULT_WINDOW_STATE: WindowState = {
    width: 1200,
    height: 800,
    isMaximized: false,
    isFullscreen: false,
};

/**
 * Default window configuration
 */
export const DEFAULT_WINDOW_CONFIG: WindowConfig = {
    customTitleBar: false,
    windowState: DEFAULT_WINDOW_STATE,
};

/**
 * Manages window appearance settings
 */
export class WindowConfigManager {
    private config: WindowConfig = DEFAULT_WINDOW_CONFIG;
    private configLoaded = false;

    constructor(private app: App) { }

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
        } catch (error: any) {
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

    /**
     * Get the saved window state
     */
    async getWindowState(): Promise<WindowState> {
        const config = await this.getConfig();
        return config.windowState || DEFAULT_WINDOW_STATE;
    }

    /**
     * Save the current window state
     */
    async saveWindowState(state: Partial<WindowState>): Promise<void> {
        const currentState = await this.getWindowState();
        const newState = { ...currentState, ...state };
        await this.saveConfig({ windowState: newState });
    }
}
