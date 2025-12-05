import { type DBSchema, type IDBPDatabase, openDB } from 'idb';
import type { App } from './App';
import type { Tab, TabContent, TabOptions } from './types/tab';

/**
 * IndexedDB schema for tab cache
 */
interface TabCacheDB extends DBSchema {
    'tab-cache': {
        key: string;
        value: TabContent;
    };
}

/**
 * TabManager - Manages tabs and their content
 * Uses IndexedDB for caching tab content
 */
export class TabManager {
    private app: App;
    private tabs: Tab[] = [];
    private activeTabId: string | null = null;
    private db: IDBPDatabase<TabCacheDB> | null = null;
    private onTabChangeCallbacks: Array<(tabId: string | null) => void> = [];

    constructor(app: App) {
        this.app = app;
    }

    /**
     * Initialize tab manager
     * Opens IndexedDB and restores tabs from config
     */
    async init(): Promise<void> {
        // Open IndexedDB
        this.db = await openDB<TabCacheDB>('inkdown-tabs', 1, {
            upgrade(db) {
                db.createObjectStore('tab-cache');
            },
        });

        // The cache can become stale and prevent tabs from loading correctly
        this.app.configManager.clearCache('app');

        // Load tabs from config (will now read from file)
        const config = await this.app.configManager.loadConfig<any>('app');

        // Clear any existing tabs (in case of re-initialization)
        this.tabs = [];
        this.activeTabId = null;

        if (config.tabs && config.tabs.length > 0) {
            // Create a Set to track unique IDs and filter duplicates
            const seenIds = new Set<string>();

            // Restore tabs from config - only restore tabs with valid filePaths
            for (const tabConfig of config.tabs) {
                // Skip if we've already seen this ID (duplicate)
                if (seenIds.has(tabConfig.id)) {
                    console.warn(`[TabManager] Duplicate tab ID found: ${tabConfig.id}, skipping`);
                    continue;
                }
                seenIds.add(tabConfig.id);

                // Skip empty tabs (tabs without filePath) - they will be recreated if needed
                if (!tabConfig.filePath) {
                    console.log(`[TabManager] Skipping empty tab: ${tabConfig.id}`);
                    continue;
                }

                const tab: Tab = {
                    id: tabConfig.id,
                    filePath: tabConfig.filePath,
                    title: this.getTitleFromPath(tabConfig.filePath),
                    isPinned: tabConfig.isPinned || false,
                    isDirty: false,
                };
                this.tabs.push(tab);
            }

            // Set active tab from config or first tab
            if (config.activeTabId && this.tabs.some((t) => t.id === config.activeTabId)) {
                this.activeTabId = config.activeTabId;
            } else if (this.tabs.length > 0) {
                this.activeTabId = this.tabs[0].id;
            }
        }

        // Only create empty tab if no tabs were restored
        if (this.tabs.length === 0) {
            // Create empty tab without saving (we'll save after init if needed)
            const emptyTab: Tab = {
                id: this.generateTabId(),
                filePath: '',
                title: 'Untitled',
                isPinned: false,
                isDirty: false,
            };
            this.tabs.push(emptyTab);
            this.activeTabId = emptyTab.id;
        }

        // Notify listeners that tabs have been loaded
        this.notifyTabChange(this.activeTabId);
    }

    /**
     * Open a tab
     */
    async openTab(filePath: string, options?: TabOptions): Promise<void> {
        // Check if tab already exists with this file
        const existingTab = this.tabs.find((t) => t.filePath === filePath);
        if (existingTab) {
            this.switchTab(existingTab.id);
            return;
        }

        const shouldOpenInNewTab = options?.openInNewTab === true;
        const activeTab = this.getActiveTab();

        // If we should NOT open in new tab, replace current tab's content
        if (!shouldOpenInNewTab && activeTab) {
            // Clear old cache if tab had a different file
            if (activeTab.filePath && activeTab.filePath !== filePath) {
                await this.clearCache(activeTab.id);
            }

            activeTab.filePath = filePath;
            activeTab.title = this.getTitleFromPath(filePath);
            activeTab.isDirty = false;
            this.notifyTabChange(activeTab.id);
            await this.saveTabs();
            return;
        }

        // Create new tab (for double-click or Ctrl+click)
        const newTab: Tab = {
            id: this.generateTabId(),
            filePath,
            title: this.getTitleFromPath(filePath),
            isPinned: options?.pinned || false,
            isDirty: false,
        };

        this.tabs.push(newTab);
        this.activeTabId = newTab.id;
        this.notifyTabChange(newTab.id);
        await this.saveTabs();
    }

    /**
     * Close a tab
     */
    async closeTab(tabId: string): Promise<void> {
        const index = this.tabs.findIndex((t) => t.id === tabId);
        if (index === -1) {
            console.warn(`Tab ${tabId} not found for closing`);
            return;
        }

        const wasActive = this.activeTabId === tabId;

        // Remove from cache
        await this.clearCache(tabId);

        // Remove tab
        this.tabs.splice(index, 1);

        // Update active tab
        if (wasActive) {
            if (this.tabs.length > 0) {
                // Switch to previous tab or first tab
                const newIndex = Math.min(index, this.tabs.length - 1);
                this.activeTabId = this.tabs[newIndex].id;
                this.notifyTabChange(this.activeTabId);
            } else {
                // Create empty tab if no tabs left
                this.createEmptyTab();
            }
        }

        await this.saveTabs();
    }

    /**
     * Switch to a tab
     */
    switchTab(tabId: string): void {
        const tab = this.tabs.find((t) => t.id === tabId);
        if (!tab) {
            console.error(`Tab ${tabId} not found`);
            return;
        }

        this.activeTabId = tabId;
        this.notifyTabChange(tabId);
    }

    /**
     * Switch to tab by index (for Alt+1, Alt+2, etc.)
     */
    switchToTabByIndex(index: number): void {
        if (index >= 0 && index < this.tabs.length) {
            const tab = this.tabs[index];
            if (tab && tab.id !== this.activeTabId) {
                this.activeTabId = tab.id;
                this.notifyTabChange(tab.id);
            }
        }
    }

    /**
     * Switch to next tab (Cmd+Tab)
     */
    switchToNextTab(): void {
        if (this.tabs.length === 0) return;

        const currentIndex = this.tabs.findIndex((t) => t.id === this.activeTabId);
        const nextIndex = (currentIndex + 1) % this.tabs.length;
        const nextTab = this.tabs[nextIndex];

        if (nextTab) {
            this.activeTabId = nextTab.id;
            this.notifyTabChange(nextTab.id);
        }
    }

    /**
     * Switch to previous tab (Cmd+Shift+Tab)
     */
    switchToPreviousTab(): void {
        if (this.tabs.length === 0) return;

        const currentIndex = this.tabs.findIndex((t) => t.id === this.activeTabId);
        const prevIndex = currentIndex - 1 < 0 ? this.tabs.length - 1 : currentIndex - 1;
        const prevTab = this.tabs[prevIndex];

        if (prevTab) {
            this.activeTabId = prevTab.id;
            this.notifyTabChange(prevTab.id);
        }
    }

    /**
     * Get active tab ID
     */
    getActiveTabId(): string | null {
        return this.activeTabId;
    }

    /**
     * Get active tab
     */
    getActiveTab(): Tab | null {
        if (!this.activeTabId) return null;
        return this.tabs.find((t) => t.id === this.activeTabId) || null;
    }

    /**
     * Get a tab by ID
     */
    getTabById(tabId: string): Tab | null {
        return this.tabs.find((t) => t.id === tabId) || null;
    }

    /**
     * Get all tabs
     */
    getAllTabs(): Tab[] {
        return this.tabs;
    }

    /**
     * Cache tab content
     */
    async cacheTab(tabId: string, content: TabContent): Promise<void> {
        if (!this.db) return;
        await this.db.put('tab-cache', content, tabId);
    }

    /**
     * Get cached tab content
     */
    async getCachedTab(tabId: string): Promise<TabContent | null> {
        if (!this.db) return null;
        const content = await this.db.get('tab-cache', tabId);
        return content || null;
    }

    /**
     * Clear cache for a tab
     */
    async clearCache(tabId: string): Promise<void> {
        if (!this.db) return;
        await this.db.delete('tab-cache', tabId);
    }

    /**
     * Mark tab as dirty (unsaved changes)
     */
    markTabDirty(tabId: string, dirty: boolean): void {
        const tab = this.tabs.find((t) => t.id === tabId);
        if (tab) {
            tab.isDirty = dirty;
        }
    }

    /**
     * Update a tab's file path (used when renaming files)
     * @param oldPath The old file path
     * @param newPath The new file path
     */
    async updateTabFilePath(oldPath: string, newPath: string): Promise<void> {
        const tab = this.tabs.find((t) => t.filePath === oldPath);
        if (tab) {
            tab.filePath = newPath;
            tab.title = this.getTitleFromPath(newPath);
            this.notifyTabChange(tab.id);
            await this.saveTabs();
        }
    }

    /**
     * Save tabs to config
     * Only saves tabs with valid filePaths (not empty tabs)
     */
    async saveTabs(): Promise<void> {
        const config = await this.app.configManager.loadConfig<any>('app');

        // Only save tabs that have a filePath (not empty/untitled tabs)
        const tabsToSave = this.tabs.filter((tab) => tab.filePath && tab.filePath.length > 0);

        config.tabs = tabsToSave.map((tab) => ({
            id: tab.id,
            filePath: tab.filePath,
            isPinned: tab.isPinned,
        }));

        // Save the active tab ID only if it has a filePath
        const activeTab = this.getActiveTab();
        config.activeTabId = activeTab && activeTab.filePath ? this.activeTabId : null;

        console.log('[TabManager] Saving tabs:', JSON.stringify(config.tabs, null, 2));
        console.log('[TabManager] Active tab:', config.activeTabId);
        console.log('[TabManager] Writing to app.json via ConfigManager...');

        await this.app.configManager.saveConfig('app', config);

        console.log('[TabManager] ✅ Tabs saved successfully to config');
    }

    /**
     * Create an empty tab (public for commands)
     */
    createEmptyTab(): Tab {
        const emptyTab: Tab = {
            id: this.generateTabId(),
            filePath: '',
            title: 'Untitled',
            isPinned: false,
            isDirty: false,
        };

        this.tabs.push(emptyTab);
        this.activeTabId = emptyTab.id;
        this.notifyTabChange(emptyTab.id);
        this.saveTabs(); // Save asynchronously
        return emptyTab;
    }

    /**
     * Generate a unique tab ID
     */
    private generateTabId(): string {
        return `tab-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Get title from file path
     */
    private getTitleFromPath(filePath: string): string {
        if (!filePath) return 'Untitled';
        const parts = filePath.split('/');
        return parts[parts.length - 1] || 'Untitled';
    }

    /**
     * Register callback for tab changes
     */
    onTabChange(callback: (tabId: string | null) => void): () => void {
        this.onTabChangeCallbacks.push(callback);
        // Return unsubscribe function
        return () => {
            const index = this.onTabChangeCallbacks.indexOf(callback);
            if (index > -1) {
                this.onTabChangeCallbacks.splice(index, 1);
            }
        };
    }

    /**
     * Notify all listeners of tab change
     */
    private notifyTabChange(tabId: string | null): void {
        this.onTabChangeCallbacks.forEach((callback) => callback(tabId));
    }
}
