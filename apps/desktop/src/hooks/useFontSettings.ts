import { useEffect } from 'react';
import { useApp } from '../contexts/AppContext';

interface AppFontConfig {
    font?: {
        family?: string;
        size?: number;
    };
}

/**
 * Hook to apply font settings from config.
 * Loads from app.json config which stores font settings under font.family and font.size.
 * Sets CSS variables for font family and size.
 */
export function useFontSettings(): void {
    const app = useApp();

    useEffect(() => {
        const applyFontSettings = async () => {
            try {
                // Load from app config which stores font as { family, size }
                const config = await app.configManager.loadConfig<AppFontConfig>('app');

                if (!config?.font) return;

                const root = document.documentElement;

                if (config.font.family) {
                    // Apply font family to both general and monospace (for code blocks)
                    root.style.setProperty('--font-family', config.font.family);
                    root.style.setProperty('--font-family-mono', config.font.family);
                }

                if (config.font.size) {
                    root.style.setProperty('--font-size-base', `${config.font.size}px`);
                    root.style.setProperty('--font-size-editor', `${config.font.size}px`);
                }
            } catch (error) {
                console.error('Failed to load font settings:', error);
            }
        };

        applyFontSettings();

        // Subscribe to config changes (when settings are saved)
        const handleConfigChange = (event: CustomEvent<{ key: string }>) => {
            if (event.detail.key === 'app') {
                applyFontSettings();
            }
        };

        window.addEventListener('config:changed', handleConfigChange as EventListener);

        return () => {
            window.removeEventListener('config:changed', handleConfigChange as EventListener);
        };
    }, [app]);
}
