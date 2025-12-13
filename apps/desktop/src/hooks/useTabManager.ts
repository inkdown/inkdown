import type { Tab, TabOptions } from '@inkdown/core';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useApp } from '../contexts/AppContext';

interface UseTabManagerReturn {
    /** All open tabs */
    tabs: Tab[];
    /** Active tab ID */
    activeTabId: string | null;
    /** Get the currently active tab */
    getActiveTab: () => Tab | null;
    /** Open a file in a tab */
    openTab: (filePath: string, options?: TabOptions) => Promise<void>;
    /** Close a tab by ID */
    closeTab: (tabId: string) => Promise<void>;
    /** Set the active tab */
    setActiveTab: (tabId: string) => void;
    /** Check if a tab is dirty */
    isTabDirty: (tabId: string) => boolean;
    /** Mark a tab as dirty or clean */
    markTabDirty: (tabId: string, dirty: boolean) => void;
}

/**
 * Hook for managing tabs via TabManager.
 * Provides reactive state updates when tabs change.
 */
export function useTabManager(): UseTabManagerReturn {
    const app = useApp();
    // Initialize with empty state - will be populated by onTabChange callback
    const [tabs, setTabs] = useState<Tab[]>([]);
    const [activeTabId, setActiveTabIdState] = useState<string | null>(null);

    // Subscribe to tab state changes and sync initial state
    useEffect(() => {
        // Sync initial state from TabManager (after init has been called)
        setTabs([...app.tabManager.getAllTabs()]);
        setActiveTabIdState(app.tabManager.getActiveTabId());

        // Subscribe to future changes
        const unsubscribe = app.tabManager.onTabChange(() => {
            setTabs([...app.tabManager.getAllTabs()]);
            setActiveTabIdState(app.tabManager.getActiveTabId());
        });

        return unsubscribe;
    }, [app]);

    const openTab = useCallback(
        async (filePath: string, options?: TabOptions) => {
            await app.tabManager.openTab(filePath, options);
        },
        [app],
    );

    const closeTab = useCallback(
        async (tabId: string) => {
            await app.tabManager.closeTab(tabId);
        },
        [app],
    );

    const setActiveTab = useCallback(
        (tabId: string) => {
            app.tabManager.switchTab(tabId);
        },
        [app],
    );

    const getActiveTab = useCallback((): Tab | null => {
        return app.tabManager.getActiveTab();
    }, [app]);

    const isTabDirty = useCallback(
        (tabId: string) => {
            const tab = app.tabManager.getTabById(tabId);
            return tab?.isDirty || false;
        },
        [app],
    );

    const markTabDirty = useCallback(
        (tabId: string, dirty: boolean) => {
            app.tabManager.markTabDirty(tabId, dirty);
        },
        [app],
    );

    return useMemo(
        () => ({
            tabs,
            activeTabId,
            getActiveTab,
            openTab,
            closeTab,
            setActiveTab,
            isTabDirty,
            markTabDirty,
        }),
        [
            tabs,
            activeTabId,
            getActiveTab,
            openTab,
            closeTab,
            setActiveTab,
            isTabDirty,
            markTabDirty,
        ],
    );
}
