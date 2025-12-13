import type { App } from '@inkdown/core';
import { useCallback, useEffect, useState } from 'react';

interface AppConfig {
    expandedDirs?: string[];
    sidebarWidth?: number;
    sidebarCollapsed?: boolean;
    sortOrder?: string;
    [key: string]: any;
}

const DEFAULT_SIDEBAR_WIDTH = 250;

export const useSidebarState = (app: App, loading: boolean) => {
    const [expandedDirs, setExpandedDirs] = useState<string[]>([]);
    const [sidebarWidth, setSidebarWidth] = useState<number>(DEFAULT_SIDEBAR_WIDTH);
    const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);
    const [sortOrder, setSortOrder] = useState<'a-z' | 'z-a'>('a-z');

    // Load sidebar settings from config
    useEffect(() => {
        if (loading) return;

        const loadSidebarSettings = async () => {
            try {
                const config = await app.configManager.loadConfig<AppConfig>('app');

                if (config?.expandedDirs) {
                    setExpandedDirs(config.expandedDirs);
                }
                if (config?.sidebarCollapsed !== undefined) {
                    setSidebarCollapsed(config.sidebarCollapsed);
                }
                if (config?.sidebarWidth) {
                    setSidebarWidth(config.sidebarWidth);
                }
                if (config?.sortOrder) {
                    setSortOrder(config.sortOrder as 'a-z' | 'z-a');
                }
            } catch (error: any) {
                console.error('Failed to load sidebar settings:', error);
            }
        };

        loadSidebarSettings();
    }, [app, loading]);

    const handleExpandedDirsChange = useCallback(
        async (dirs: string[]) => {
            setExpandedDirs(dirs);
            try {
                const config = await app.configManager.loadConfig<AppConfig>('app');
                config.expandedDirs = dirs;
                await app.configManager.saveConfig('app', config);
            } catch (error: any) {
                console.error('Failed to save expanded dirs:', error);
            }
        },
        [app],
    );

    const handleSidebarWidthChange = useCallback(
        async (width: number) => {
            setSidebarWidth(width);
            try {
                const config = await app.configManager.loadConfig<AppConfig>('app');
                config.sidebarWidth = width;
                await app.configManager.saveConfig('app', config);
            } catch (error: any) {
                console.error('Failed to save sidebar width:', error);
            }
        },
        [app],
    );

    const handleSidebarCollapsedChange = useCallback(
        async (collapsed: boolean) => {
            setSidebarCollapsed(collapsed);
            try {
                const config = await app.configManager.loadConfig<AppConfig>('app');
                config.sidebarCollapsed = collapsed;
                await app.configManager.saveConfig('app', config);
            } catch (error: any) {
                console.error('Failed to save sidebar collapsed state:', error);
            }
        },
        [app],
    );

    const handleSortOrderChange = useCallback(
        async (order: 'a-z' | 'z-a') => {
            setSortOrder(order);
            try {
                const config = await app.configManager.loadConfig<AppConfig>('app');
                config.sortOrder = order;
                await app.configManager.saveConfig('app', config);
            } catch (error: any) {
                console.error('Failed to save sort order:', error);
            }
        },
        [app],
    );

    return {
        expandedDirs,
        sidebarWidth,
        sidebarCollapsed,
        sortOrder,
        handleExpandedDirsChange,
        handleSidebarWidthChange,
        handleSidebarCollapsedChange,
        handleSortOrderChange,
    };
};
