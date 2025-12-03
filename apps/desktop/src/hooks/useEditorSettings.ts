import { useState, useEffect, useCallback } from 'react';
import type { App, EditorConfig } from '@inkdown/core';
import { DEFAULT_EDITOR_CONFIG } from '@inkdown/core';

export type ViewMode = 'editor' | 'preview' | 'side-by-side';

interface AppConfig {
    viewMode?: ViewMode;
    [key: string]: any;
}

export const useEditorSettings = (app: App) => {
    const [viewMode, setViewMode] = useState<ViewMode>('side-by-side');
    const [editorConfig, setEditorConfig] = useState<EditorConfig>(DEFAULT_EDITOR_CONFIG);

    // Load editor configuration
    useEffect(() => {
        const loadEditorConfig = async () => {
            try {
                const config = await app.configManager.loadConfig<EditorConfig>('editor');
                if (config) {
                    setEditorConfig(config);
                }
            } catch (error) {
                console.error('Failed to load editor config:', error);
            }
        };
        loadEditorConfig();

        // Listen for config changes from settings modal
        const handleConfigChange = (e: CustomEvent<EditorConfig>) => {
            setEditorConfig(e.detail);
        };
        window.addEventListener('inkdown:editor-config-changed', handleConfigChange as EventListener);
        return () => {
            window.removeEventListener('inkdown:editor-config-changed', handleConfigChange as EventListener);
        };
    }, [app]);

    // Load view mode from config
    useEffect(() => {
        const loadViewMode = async () => {
            try {
                const config = await app.configManager.loadConfig<AppConfig>('app');
                if (config?.viewMode) {
                    setViewMode(config.viewMode as ViewMode);
                }
            } catch (error) {
                console.error('Failed to load view mode:', error);
            }
        };
        loadViewMode();
    }, [app]);

    const handleViewModeChange = useCallback(
        async (mode: ViewMode) => {
            setViewMode(mode);
            try {
                const config = await app.configManager.loadConfig<AppConfig>('app');
                config.viewMode = mode;
                await app.configManager.saveConfig('app', config);
            } catch (error) {
                console.error('Failed to save view mode:', error);
            }
        },
        [app]
    );

    return {
        viewMode,
        editorConfig,
        handleViewModeChange,
    };
};
