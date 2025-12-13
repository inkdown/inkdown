import type { App, SyncConfig } from '@inkdown/core';
import { useEffect, useState } from 'react';

export const useOnboarding = (app: App, loading: boolean) => {
    const [needsOnboarding, setNeedsOnboarding] = useState(false);

    useEffect(() => {
        if (loading) return;

        const checkOnboarding = async () => {
            try {
                const syncConfig = await app.configManager.loadConfig<SyncConfig>('sync');
                setNeedsOnboarding(!syncConfig?.onboardingCompleted);
            } catch (error: any) {
                console.error('Failed to check onboarding:', error);
            }
        };

        checkOnboarding();
    }, [app, loading]);

    return { needsOnboarding };
};

export const useWindowConfig = (app: App) => {
    const [useCustomTitleBar, setUseCustomTitleBar] = useState<boolean>(false);

    useEffect(() => {
        const loadWindowConfig = async () => {
            try {
                const config = await app.windowConfigManager.loadConfig();
                setUseCustomTitleBar(config.customTitleBar);
            } catch (error: any) {
                console.error('Failed to load window config:', error);
            }
        };
        loadWindowConfig();
    }, [app]);

    return { useCustomTitleBar };
};
