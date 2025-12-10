import { useCallback, useEffect, useState } from 'react';
import { useApp } from '../contexts/AppContext';

/**
 * Hook for loading and saving configuration
 *
 * @param configName - The name of the config to load/save
 * @returns [config, saveConfig, loading]
 */
export function useConfig<T>(configName: string): [T | null, (data: T) => Promise<void>, boolean] {
    const app = useApp();
    const [config, setConfig] = useState<T | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadConfig = async () => {
            try {
                const data = await app.configManager.loadConfig<T>(configName);
                setConfig(data);
            } catch (error: any) {
                console.error(`Failed to load config ${configName}:`, error);
            } finally {
                setLoading(false);
            }
        };

        loadConfig();
    }, [app, configName]);

    const saveConfig = useCallback(
        async (data: T) => {
            try {
                await app.configManager.saveConfig(configName, data);
                setConfig(data);
            } catch (error: any) {
                console.error(`Failed to save config ${configName}:`, error);
                throw error;
            }
        },
        [app, configName],
    );

    return [config, saveConfig, loading];
}
