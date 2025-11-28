import { invoke } from '@tauri-apps/api/core';
import type { App } from './App';
import type { ColorScheme, ThemeConfig } from './types/theme';

/**
 * ThemeManager - Manages theme loading and switching
 * Supports both built-in and custom themes
 *
 * - Built-in themes use .theme-dark and .theme-light classes on documentElement
 * - CSS variables are defined in these classes and override body defaults
 */
export class ThemeManager {
    private app: App;
    private currentTheme = 'default-dark';
    private colorScheme: ColorScheme = 'dark';
    private availableThemes: Map<string, ThemeConfig> = new Map();
    private customThemeStyleElement: HTMLStyleElement | null = null;

    constructor(app: App) {
        this.app = app;
    }

    /**
     * Initialize theme manager
     * Loads theme from config and applies it
     */
    async init(): Promise<void> {
        // Register built-in themes
        this.registerBuiltInThemes();

        // Load custom themes
        await this.loadCustomThemes();

        // Load theme from config
        const config = await this.app.configManager.loadConfig<any>('app');
        this.colorScheme = config?.colorScheme || 'dark';
        this.currentTheme =
            config?.theme || (this.colorScheme === 'dark' ? 'default-dark' : 'default-light');

        // Apply color scheme (this also sets the theme)
        this.applyColorScheme(this.colorScheme);

        console.log(`ThemeManager initialized with ${this.colorScheme} scheme`);
    }

    /**
     * Register built-in themes
     */
    private registerBuiltInThemes(): void {
        this.availableThemes.set('default-dark', {
            id: 'default-dark',
            name: 'Default Dark',
            author: 'Inkdown',
            version: '1.0.0',
            modes: ['dark'],
            builtIn: true,
        });

        this.availableThemes.set('default-light', {
            id: 'default-light',
            name: 'Default Light',
            author: 'Inkdown',
            version: '1.0.0',
            modes: ['light'],
            builtIn: true,
        });
    }

    /**
     * Load custom themes from themes directory
     */
    private async loadCustomThemes(): Promise<void> {
        try {
            const themes = await invoke<string[]>('list_custom_themes');

            for (const themeName of themes) {
                try {
                    const manifestContent = await invoke<string>('read_theme_manifest', {
                        themeName,
                    });
                    const manifest = JSON.parse(manifestContent);
                    const themeConfig: ThemeConfig = {
                        id: themeName,
                        name: manifest.name,
                        author: manifest.author,
                        version: manifest.version,
                        modes: manifest.modes,
                        builtIn: false,
                    };
                    this.availableThemes.set(themeName, themeConfig);
                } catch (error) {
                    console.error(`Failed to load theme ${themeName}:`, error);
                }
            }
        } catch {
            // Custom themes not available, that's fine
        }
    }

    /**
     * Load a theme
     */
    async loadTheme(themeName: string): Promise<void> {
        await this.setTheme(themeName);
    }

    /**
     * Set the current theme by ID
     */
    async setTheme(themeId: string): Promise<void> {
        const theme = this.availableThemes.get(themeId);
        if (!theme) {
            console.error(`Theme ${themeId} not found`);
            return;
        }

        // For built-in themes, we just need to set the color scheme class
        // The CSS is already loaded globally via main.tsx imports
        if (theme.builtIn) {
            const scheme = themeId.includes('light') ? 'light' : 'dark';
            this.applyColorScheme(scheme);
        } else {
            // For custom themes, load and inject the CSS
            try {
                const cssContent = await invoke<string>('read_theme_css', { themeName: themeId });
                this.applyCustomThemeCSS(cssContent);
            } catch (error) {
                console.error(`Failed to load custom theme ${themeId}:`, error);
                return;
            }
        }

        this.currentTheme = themeId;

        // Save to config
        const config = await this.app.configManager.loadConfig<any>('app');
        if (config) {
            config.theme = themeId;
            await this.app.configManager.saveConfig('app', config);
        }
    }

    /**
     * Apply color scheme class to document
     * This is the key to making themes work - the CSS selectors .theme-dark and .theme-light
     * will match based on this class
     */
    private applyColorScheme(scheme: ColorScheme): void {
        // Remove both classes first
        document.documentElement.classList.remove('theme-light', 'theme-dark');
        // Add the correct one
        document.documentElement.classList.add(`theme-${scheme}`);

        console.log(
            `[ThemeManager] Applied color scheme: ${scheme}, classes:`,
            document.documentElement.className,
        );

        this.colorScheme = scheme;
    }

    /**
     * Apply custom theme CSS (for non-built-in themes)
     */
    private applyCustomThemeCSS(cssContent: string): void {
        // Remove existing custom theme style element
        if (this.customThemeStyleElement) {
            this.customThemeStyleElement.remove();
        }

        // Create new style element for custom theme
        this.customThemeStyleElement = document.createElement('style');
        this.customThemeStyleElement.id = 'inkdown-custom-theme';
        this.customThemeStyleElement.textContent = cssContent;
        document.head.appendChild(this.customThemeStyleElement);
    }

    /**
     * Set color scheme (light/dark)
     * This switches between built-in themes
     */
    async setColorScheme(scheme: ColorScheme): Promise<void> {
        console.log('[ThemeManager] setColorScheme START - scheme:', scheme);
        // Apply the color scheme class
        this.applyColorScheme(scheme);

        // Set the corresponding default theme
        const themeName = scheme === 'dark' ? 'default-dark' : 'default-light';
        this.currentTheme = themeName;

        // Remove any custom theme CSS when switching to built-in
        if (this.customThemeStyleElement) {
            this.customThemeStyleElement.remove();
            this.customThemeStyleElement = null;
        }

        // Save to config
        const config = await this.app.configManager.loadConfig<any>('app');
        if (config) {
            config.colorScheme = scheme;
            config.theme = themeName;
            await this.app.configManager.saveConfig('app', config);
        }
    }

    /**
     * Get current theme ID
     */
    getCurrentTheme(): string {
        return this.currentTheme;
    }

    /**
     * Get current color scheme
     */
    getColorScheme(): ColorScheme {
        return this.colorScheme;
    }

    /**
     * Get all available themes as ThemeConfig array
     */
    getThemes(): ThemeConfig[] {
        return Array.from(this.availableThemes.values());
    }

    /**
     * Get all available themes (alias for getThemes)
     * @deprecated Use getThemes() instead
     */
    getAvailableThemes(): ThemeConfig[] {
        return this.getThemes();
    }

    /**
     * Check if a theme exists
     */
    hasTheme(themeName: string): boolean {
        return this.availableThemes.has(themeName);
    }
}
