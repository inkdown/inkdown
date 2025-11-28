import { useEffect } from 'react';
import { useApp } from '../contexts/AppContext';

/**
 * Hook to apply font settings from config.
 * Sets CSS variables for font family, size, and line height.
 */
export function useFontSettings(): void {
    const app = useApp();

    useEffect(() => {
        const applyFontSettings = async () => {
            try {
                const config = await app.configManager.loadConfig<{
                    fontFamily?: string;
                    fontSize?: number;
                    lineHeight?: number;
                    editorFontSize?: number;
                }>('editor');

                if (!config) return;

                const root = document.documentElement;

                if (config.fontFamily) {
                    root.style.setProperty('--font-family', config.fontFamily);
                }

                if (config.fontSize) {
                    root.style.setProperty('--font-size-base', `${config.fontSize}px`);
                }

                if (config.editorFontSize) {
                    root.style.setProperty('--font-size-editor', `${config.editorFontSize}px`);
                }

                if (config.lineHeight) {
                    root.style.setProperty('--line-height-base', String(config.lineHeight));
                }
            } catch (error) {
                console.error('Failed to load font settings:', error);
            }
        };

        applyFontSettings();

        // Subscribe to config changes
        const handleConfigChange = (event: CustomEvent<{ key: string }>) => {
            if (event.detail.key === 'editor') {
                applyFontSettings();
            }
        };

        window.addEventListener('config:changed', handleConfigChange as EventListener);

        return () => {
            window.removeEventListener('config:changed', handleConfigChange as EventListener);
        };
    }, [app]);
}
