import {
    type ConfigManager,
    type EditorRegistry,
    type EditorStateManager,
    type FileSystemManager,
    App as InkdownApp,
    type CommandManager,
    type PluginManager,
    type TabManager,
    type ThemeManager,
} from '@inkdown/core';
import { getBuiltInPlugins } from '@inkdown/plugins';
import { KeybindingManager } from '../managers/KeybindingManager';
import { WindowConfigManager } from '../managers/WindowConfigManager';
import type React from 'react';
import { createContext, useContext, useEffect, useRef, useState } from 'react';

interface AppContextValue {
    app: InkdownApp;
    pluginManager: PluginManager;
    configManager: ConfigManager;
    themeManager: ThemeManager;
    commandManager: CommandManager;
    keybindingManager?: KeybindingManager;
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

    // Initialize Desktop-specific managers
    // Initialize Desktop-specific managers
    if (!app.windowConfigManager) {
        // @ts-expect-error - Assigned via module augmentation
        app.windowConfigManager = new WindowConfigManager(app);
    }
    if (!app.keybindingManager) {
        // @ts-expect-error - Assigned via module augmentation
        app.keybindingManager = new KeybindingManager(app);
    }

    // Initialize app
    useEffect(() => {
        const initializeApp = async () => {
            try {
                // Initialize the app (this calls init on all managers including CommandManager)
                await app.init();

                // Initialize Desktop-specific managers that depend on app being initialized
                if (app.keybindingManager) {
                    await (app.keybindingManager as KeybindingManager).init();
                }

                setIsInitialized(true);
            } catch (error: any) {
                console.error('Failed to initialize app:', error);
            }
        };

        initializeApp();

        // Cleanup on unmount
        return () => {
            app.cleanup();
            (app.keybindingManager as KeybindingManager)?.cleanup();
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
        commandManager: app.commandManager,
        keybindingManager: app.keybindingManager as KeybindingManager,
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
 * Hook to access the CommandManager.
 */
export function useCommandManager(): CommandManager {
    const context = useContext(AppContext);
    if (!context) {
        throw new Error('useCommandManager must be used within an AppProvider');
    }
    return context.commandManager;
}

/**
 * Hook to access the KeybindingManager.
 */
export function useKeybindingManager(): KeybindingManager | undefined {
    const context = useContext(AppContext);
    if (!context) {
        throw new Error('useKeybindingManager must be used within an AppProvider');
    }
    return context.keybindingManager;
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
