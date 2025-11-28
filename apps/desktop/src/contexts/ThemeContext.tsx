import type { ColorScheme, ThemeConfig } from '@inkdown/core';
import type React from 'react';
import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { useApp } from './AppContext';

interface ThemeContextValue {
    /** Current color scheme (light/dark) */
    colorScheme: ColorScheme;
    /** Set color scheme */
    setColorScheme: (scheme: ColorScheme) => void;
    /** Toggle between light and dark */
    toggleColorScheme: () => void;
    /** Current theme ID */
    currentTheme: string;
    /** Set theme by ID */
    setTheme: (themeId: string) => void;
    /** Available themes */
    themes: ThemeConfig[];
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

/**
 * Provides theme state and methods to the component tree.
 * Integrates with ThemeManager from core for theme application.
 */
export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const app = useApp();
    const [colorScheme, setColorSchemeState] = useState<ColorScheme>('dark');
    const [currentTheme, setCurrentTheme] = useState<string>('default');
    const [themes, setThemes] = useState<ThemeConfig[]>([]);

    // Initialize theme from saved config
    useEffect(() => {
        const initTheme = async () => {
            try {
                // Load saved theme config
                const config = await app.configManager.loadConfig<{
                    colorScheme?: ColorScheme;
                    theme?: string;
                }>('theme');

                if (config?.colorScheme) {
                    setColorSchemeState(config.colorScheme);
                    app.themeManager.setColorScheme(config.colorScheme);
                }

                if (config?.theme) {
                    setCurrentTheme(config.theme);
                }

                // Get available themes
                setThemes(app.themeManager.getThemes());
            } catch (error) {
                console.error('Failed to load theme config:', error);
            }
        };

        initTheme();
    }, [app]);

    // Apply color scheme to document
    useEffect(() => {
        // Remove previous theme class
        document.documentElement.classList.remove('theme-light', 'theme-dark');
        // Add current theme class
        document.documentElement.classList.add(`theme-${colorScheme}`);

        // Also set data attribute for CSS selectors
        document.documentElement.dataset.theme = colorScheme;
    }, [colorScheme]);

    const setColorScheme = useCallback(
        async (scheme: ColorScheme) => {
            setColorSchemeState(scheme);
            app.themeManager.setColorScheme(scheme);

            // Save to config
            await app.configManager.saveConfig('theme', {
                colorScheme: scheme,
                theme: currentTheme,
            });
        },
        [app, currentTheme],
    );

    const toggleColorScheme = useCallback(() => {
        const newScheme = colorScheme === 'dark' ? 'light' : 'dark';
        setColorScheme(newScheme);
    }, [colorScheme, setColorScheme]);

    const setTheme = useCallback(
        async (themeId: string) => {
            const theme = themes.find((t) => t.id === themeId);
            if (theme) {
                app.themeManager.setTheme(themeId);
                setCurrentTheme(themeId);

                // Save to config
                await app.configManager.saveConfig('theme', {
                    colorScheme,
                    theme: themeId,
                });
            }
        },
        [app, themes, colorScheme],
    );

    const contextValue: ThemeContextValue = {
        colorScheme,
        setColorScheme,
        toggleColorScheme,
        currentTheme,
        setTheme,
        themes,
    };

    return <ThemeContext.Provider value={contextValue}>{children}</ThemeContext.Provider>;
};

/**
 * Hook to access theme state and methods.
 * Must be used within a ThemeProvider.
 */
export function useTheme(): ThemeContextValue {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
}

export { ThemeContext };
