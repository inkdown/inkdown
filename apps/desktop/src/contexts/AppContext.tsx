import {
    type ConfigManager,
    type EditorRegistry,
    type EditorStateManager,
    type FileSystemManager,
    App as InkdownApp,
    type PluginManager,
    type ShortcutManager,
    type TabManager,
    type ThemeManager,
} from '@inkdown/core';
import { getBuiltInPlugins } from '@inkdown/plugins';
import type React from 'react';
import { createContext, useContext, useEffect, useRef, useState } from 'react';

interface AppContextValue {
    app: InkdownApp;
    pluginManager: PluginManager;
    configManager: ConfigManager;
    themeManager: ThemeManager;
    shortcutManager: ShortcutManager;
    tabManager: TabManager;
    editorStateManager: EditorStateManager;
    editorRegistry: EditorRegistry;
    fileSystemManager: FileSystemManager;
}

const AppContext = createContext<AppContextValue | null>(null);

/**
 * Provides the core Inkdown App instance and all managers to the component tree.
 * Initializes the plugin system with desktop-specific plugin loaders.
 */
export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const appRef = useRef<InkdownApp | null>(null);
    const [isInitialized, setIsInitialized] = useState(false);

    // Create App instance on first render
    if (!appRef.current) {
        appRef.current = new InkdownApp(getBuiltInPlugins());
    }

    const app = appRef.current;

    // Initialize app
    useEffect(() => {
        const initializeApp = async () => {
            try {
                // Initialize the app (this calls init on all managers including ShortcutManager)
                await app.init();

                setIsInitialized(true);
            } catch (error: any) {
                console.error('Failed to initialize app:', error);
            }
        };

        initializeApp();

        // Cleanup on unmount
        return () => {
            app.cleanup();
        };
    }, [app]);

    if (!isInitialized) {
        return (
            <div className="app-loading">
                <div className="loading-spinner" />
                <p>Initializing Inkdown...</p>
            </div>
        );
    }

    const contextValue: AppContextValue = {
        app,
        pluginManager: app.pluginManager,
        configManager: app.configManager,
        themeManager: app.themeManager,
        shortcutManager: app.shortcutManager,
        tabManager: app.tabManager,
        editorStateManager: app.editorStateManager,
        editorRegistry: app.editorRegistry,
        fileSystemManager: app.fileSystemManager,
    };

    return <AppContext.Provider value={contextValue}>{children}</AppContext.Provider>;
};

/**
 * Hook to access the Inkdown App and all its managers.
 * Must be used within an AppProvider.
 */
export function useApp(): InkdownApp {
    const context = useContext(AppContext);
    if (!context) {
        throw new Error('useApp must be used within an AppProvider');
    }
    return context.app;
}

/**
 * Hook to access the PluginManager.
 */
export function usePluginManager(): PluginManager {
    const context = useContext(AppContext);
    if (!context) {
        throw new Error('usePluginManager must be used within an AppProvider');
    }
    return context.pluginManager;
}

/**
 * Hook to access the ConfigManager.
 */
export function useConfigManager(): ConfigManager {
    const context = useContext(AppContext);
    if (!context) {
        throw new Error('useConfigManager must be used within an AppProvider');
    }
    return context.configManager;
}

/**
 * Hook to access the ThemeManager.
 */
export function useThemeManager(): ThemeManager {
    const context = useContext(AppContext);
    if (!context) {
        throw new Error('useThemeManager must be used within an AppProvider');
    }
    return context.themeManager;
}

/**
 * Hook to access the ShortcutManager.
 */
export function useShortcutManager(): ShortcutManager {
    const context = useContext(AppContext);
    if (!context) {
        throw new Error('useShortcutManager must be used within an AppProvider');
    }
    return context.shortcutManager;
}

/**
 * Hook to access the TabManager.
 */
export function useTabManager(): TabManager {
    const context = useContext(AppContext);
    if (!context) {
        throw new Error('useTabManager must be used within an AppProvider');
    }
    return context.tabManager;
}

/**
 * Hook to access the EditorStateManager.
 */
export function useEditorStateManager(): EditorStateManager {
    const context = useContext(AppContext);
    if (!context) {
        throw new Error('useEditorStateManager must be used within an AppProvider');
    }
    return context.editorStateManager;
}

/**
 * Hook to access the EditorRegistry.
 */
export function useEditorRegistry(): EditorRegistry {
    const context = useContext(AppContext);
    if (!context) {
        throw new Error('useEditorRegistry must be used within an AppProvider');
    }
    return context.editorRegistry;
}

/**
 * Hook to access the FileSystemManager.
 */
export function useFileSystemManager(): FileSystemManager {
    const context = useContext(AppContext);
    if (!context) {
        throw new Error('useFileSystemManager must be used within an AppProvider');
    }
    return context.fileSystemManager;
}

export { AppContext };
