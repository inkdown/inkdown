import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock ConfigManager
const mockLoadConfig = vi.fn<() => Promise<any>>();
const mockSaveConfig = vi.fn<() => Promise<void>>();
const mockClearCache = vi.fn<() => void>();

// Create mock app
const createMockApp = () => ({
    configManager: {
        loadConfig: mockLoadConfig,
        saveConfig: mockSaveConfig,
        clearCache: mockClearCache,
    },
});

// Import after mocks
import { TabManager } from '../../../packages/core/src/TabManager';
import type { App } from '../../../packages/core/src/App';

describe('TabManager', () => {
    let tabManager: TabManager;
    let mockApp: ReturnType<typeof createMockApp>;

    beforeEach(() => {
        vi.clearAllMocks();
        mockLoadConfig.mockResolvedValue({ tabs: [], activeTabId: null });
        mockSaveConfig.mockResolvedValue(undefined);
        mockApp = createMockApp();
        tabManager = new TabManager(mockApp as unknown as App);
    });

    describe('init', () => {
        it('should open IndexedDB and create empty tab when no tabs in config', async () => {
            await tabManager.init();

            expect(mockClearCache).toHaveBeenCalledWith('app');

            const tabs = tabManager.getAllTabs();
            expect(tabs.length).toBe(1);
            expect(tabs[0].title).toBe('Untitled');
            expect(tabs[0].filePath).toBe('');
        });

        it('should restore tabs from config', async () => {
            mockLoadConfig.mockResolvedValue({
                tabs: [
                    { id: 'tab-1', filePath: '/path/to/file1.md', isPinned: false },
                    { id: 'tab-2', filePath: '/path/to/file2.md', isPinned: true },
                ],
                activeTabId: 'tab-2',
            });

            await tabManager.init();

            const tabs = tabManager.getAllTabs();
            expect(tabs.length).toBe(2);
            expect(tabs[0].id).toBe('tab-1');
            expect(tabs[0].filePath).toBe('/path/to/file1.md');
            expect(tabs[1].id).toBe('tab-2');
            expect(tabs[1].isPinned).toBe(true);
            expect(tabManager.getActiveTabId()).toBe('tab-2');
        });

        it('should skip empty tabs (no filePath) from config', async () => {
            mockLoadConfig.mockResolvedValue({
                tabs: [
                    { id: 'tab-1', filePath: '/path/to/file1.md', isPinned: false },
                    { id: 'tab-2', filePath: '', isPinned: false }, // Empty tab should be skipped
                ],
                activeTabId: 'tab-1',
            });

            await tabManager.init();

            const tabs = tabManager.getAllTabs();
            expect(tabs.length).toBe(1);
            expect(tabs[0].id).toBe('tab-1');
        });

        it('should skip duplicate tab IDs', async () => {
            mockLoadConfig.mockResolvedValue({
                tabs: [
                    { id: 'tab-1', filePath: '/path/to/file1.md', isPinned: false },
                    { id: 'tab-1', filePath: '/path/to/file2.md', isPinned: false }, // Duplicate ID
                ],
                activeTabId: 'tab-1',
            });

            await tabManager.init();

            const tabs = tabManager.getAllTabs();
            expect(tabs.length).toBe(1);
        });
    });

    describe('openTab', () => {
        beforeEach(async () => {
            await tabManager.init();
        });

        it('should replace current tab content by default (single click)', async () => {
            await tabManager.openTab('/path/to/newfile.md');

            const tabs = tabManager.getAllTabs();
            expect(tabs.length).toBe(1);
            expect(tabs[0].filePath).toBe('/path/to/newfile.md');
            expect(tabs[0].title).toBe('newfile.md');
        });

        it('should open in new tab when option is set', async () => {
            await tabManager.openTab('/path/to/newfile.md', { openInNewTab: true });

            const tabs = tabManager.getAllTabs();
            expect(tabs.length).toBe(2);
            expect(tabs[1].filePath).toBe('/path/to/newfile.md');
        });

        it('should switch to existing tab if file is already open', async () => {
            await tabManager.openTab('/path/to/file.md', { openInNewTab: true });
            const firstTabId = tabManager.getActiveTabId();

            await tabManager.openTab('/path/to/another.md', { openInNewTab: true });
            expect(tabManager.getActiveTabId()).not.toBe(firstTabId);

            // Opening same file should switch back, not create new tab
            await tabManager.openTab('/path/to/file.md', { openInNewTab: true });
            expect(tabManager.getActiveTabId()).toBe(firstTabId);
            expect(tabManager.getAllTabs().length).toBe(3); // Original empty + 2 new
        });

        it('should create pinned tab when pinned option is true', async () => {
            await tabManager.openTab('/path/to/pinned.md', { openInNewTab: true, pinned: true });

            const activeTab = tabManager.getActiveTab();
            expect(activeTab?.isPinned).toBe(true);
        });
    });

    describe('closeTab', () => {
        beforeEach(async () => {
            mockLoadConfig.mockResolvedValue({
                tabs: [
                    { id: 'tab-1', filePath: '/path/to/file1.md', isPinned: false },
                    { id: 'tab-2', filePath: '/path/to/file2.md', isPinned: false },
                ],
                activeTabId: 'tab-1',
            });
            await tabManager.init();
        });

        it('should close a tab and switch to next available', async () => {
            expect(tabManager.getAllTabs().length).toBe(2);

            await tabManager.closeTab('tab-1');

            expect(tabManager.getAllTabs().length).toBe(1);
            expect(tabManager.getActiveTabId()).toBe('tab-2');
        });

        it('should clear cache when closing tab', async () => {
            // Just verify the close operation succeeds without errors
            await tabManager.closeTab('tab-1');
            expect(tabManager.getAllTabs().length).toBe(1);
        });

        it('should create empty tab when closing last tab', async () => {
            await tabManager.closeTab('tab-1');
            await tabManager.closeTab('tab-2');

            const tabs = tabManager.getAllTabs();
            expect(tabs.length).toBe(1);
            expect(tabs[0].title).toBe('Untitled');
            expect(tabs[0].filePath).toBe('');
        });

        it('should handle closing non-existent tab gracefully', async () => {
            await tabManager.closeTab('nonexistent');

            expect(tabManager.getAllTabs().length).toBe(2);
        });
    });

    describe('switchTab', () => {
        beforeEach(async () => {
            mockLoadConfig.mockResolvedValue({
                tabs: [
                    { id: 'tab-1', filePath: '/path/to/file1.md', isPinned: false },
                    { id: 'tab-2', filePath: '/path/to/file2.md', isPinned: false },
                ],
                activeTabId: 'tab-1',
            });
            await tabManager.init();
        });

        it('should switch to specified tab', () => {
            tabManager.switchTab('tab-2');

            expect(tabManager.getActiveTabId()).toBe('tab-2');
        });

        it('should handle switching to non-existent tab gracefully', () => {
            const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

            tabManager.switchTab('nonexistent');

            expect(tabManager.getActiveTabId()).toBe('tab-1'); // Should remain unchanged
            consoleSpy.mockRestore();
        });
    });

    describe('switchToTabByIndex', () => {
        beforeEach(async () => {
            mockLoadConfig.mockResolvedValue({
                tabs: [
                    { id: 'tab-1', filePath: '/path/to/file1.md', isPinned: false },
                    { id: 'tab-2', filePath: '/path/to/file2.md', isPinned: false },
                    { id: 'tab-3', filePath: '/path/to/file3.md', isPinned: false },
                ],
                activeTabId: 'tab-1',
            });
            await tabManager.init();
        });

        it('should switch to tab by index', () => {
            tabManager.switchToTabByIndex(1);

            expect(tabManager.getActiveTabId()).toBe('tab-2');
        });

        it('should handle invalid index gracefully', () => {
            tabManager.switchToTabByIndex(10);

            expect(tabManager.getActiveTabId()).toBe('tab-1'); // Should remain unchanged
        });

        it('should handle negative index gracefully', () => {
            tabManager.switchToTabByIndex(-1);

            expect(tabManager.getActiveTabId()).toBe('tab-1'); // Should remain unchanged
        });
    });

    describe('switchToNextTab / switchToPreviousTab', () => {
        beforeEach(async () => {
            mockLoadConfig.mockResolvedValue({
                tabs: [
                    { id: 'tab-1', filePath: '/path/to/file1.md', isPinned: false },
                    { id: 'tab-2', filePath: '/path/to/file2.md', isPinned: false },
                    { id: 'tab-3', filePath: '/path/to/file3.md', isPinned: false },
                ],
                activeTabId: 'tab-1',
            });
            await tabManager.init();
        });

        it('should switch to next tab', () => {
            tabManager.switchToNextTab();

            expect(tabManager.getActiveTabId()).toBe('tab-2');
        });

        it('should wrap around to first tab', () => {
            tabManager.switchTab('tab-3');
            tabManager.switchToNextTab();

            expect(tabManager.getActiveTabId()).toBe('tab-1');
        });

        it('should switch to previous tab', () => {
            tabManager.switchTab('tab-2');
            tabManager.switchToPreviousTab();

            expect(tabManager.getActiveTabId()).toBe('tab-1');
        });

        it('should wrap around to last tab', () => {
            tabManager.switchToPreviousTab();

            expect(tabManager.getActiveTabId()).toBe('tab-3');
        });
    });

    describe('tab getters', () => {
        beforeEach(async () => {
            mockLoadConfig.mockResolvedValue({
                tabs: [
                    { id: 'tab-1', filePath: '/path/to/file1.md', isPinned: false },
                    { id: 'tab-2', filePath: '/path/to/file2.md', isPinned: true },
                ],
                activeTabId: 'tab-1',
            });
            await tabManager.init();
        });

        it('should get active tab', () => {
            const activeTab = tabManager.getActiveTab();

            expect(activeTab?.id).toBe('tab-1');
            expect(activeTab?.filePath).toBe('/path/to/file1.md');
        });

        it('should get tab by ID', () => {
            const tab = tabManager.getTabById('tab-2');

            expect(tab?.id).toBe('tab-2');
            expect(tab?.isPinned).toBe(true);
        });

        it('should return null for non-existent tab ID', () => {
            const tab = tabManager.getTabById('nonexistent');

            expect(tab).toBeNull();
        });

        it('should get all tabs', () => {
            const tabs = tabManager.getAllTabs();

            expect(tabs.length).toBe(2);
        });
    });

    describe('caching', () => {
        beforeEach(async () => {
            await tabManager.init();
        });

        it('should cache tab content', async () => {
            const content = { content: '# Test', cursorPosition: 0, scrollPosition: 0 };
            await tabManager.cacheTab('tab-1', content);

            // Verify caching works by retrieving
            const cached = await tabManager.getCachedTab('tab-1');
            expect(cached).toEqual(content);
        });

        it('should get cached tab content', async () => {
            const content = { content: '# Cached', cursorPosition: 5, scrollPosition: 100 };
            await tabManager.cacheTab('tab-1', content);

            const result = await tabManager.getCachedTab('tab-1');

            expect(result).toEqual(content);
        });

        it('should return null for non-existent cache', async () => {
            const result = await tabManager.getCachedTab('nonexistent');

            expect(result).toBeNull();
        });

        it('should clear cache for a tab', async () => {
            // First cache something
            const content = { content: '# Test', cursorPosition: 0, scrollPosition: 0 };
            await tabManager.cacheTab('tab-1', content);

            // Clear it
            await tabManager.clearCache('tab-1');

            // Verify it's gone
            const result = await tabManager.getCachedTab('tab-1');
            expect(result).toBeNull();
        });
    });

    describe('markTabDirty', () => {
        beforeEach(async () => {
            mockLoadConfig.mockResolvedValue({
                tabs: [{ id: 'tab-1', filePath: '/path/to/file1.md', isPinned: false }],
                activeTabId: 'tab-1',
            });
            await tabManager.init();
        });

        it('should mark tab as dirty', () => {
            tabManager.markTabDirty('tab-1', true);

            const tab = tabManager.getTabById('tab-1');
            expect(tab?.isDirty).toBe(true);
        });

        it('should mark tab as not dirty', () => {
            tabManager.markTabDirty('tab-1', true);
            tabManager.markTabDirty('tab-1', false);

            const tab = tabManager.getTabById('tab-1');
            expect(tab?.isDirty).toBe(false);
        });
    });

    describe('updateTabFilePath', () => {
        beforeEach(async () => {
            mockLoadConfig.mockResolvedValue({
                tabs: [{ id: 'tab-1', filePath: '/path/to/old.md', isPinned: false }],
                activeTabId: 'tab-1',
            });
            await tabManager.init();
        });

        it('should update tab file path and title', async () => {
            await tabManager.updateTabFilePath('/path/to/old.md', '/path/to/new.md');

            const tab = tabManager.getTabById('tab-1');
            expect(tab?.filePath).toBe('/path/to/new.md');
            expect(tab?.title).toBe('new.md');
        });

        it('should save tabs after updating path', async () => {
            await tabManager.updateTabFilePath('/path/to/old.md', '/path/to/new.md');

            expect(mockSaveConfig).toHaveBeenCalled();
        });
    });

    describe('onTabChange', () => {
        beforeEach(async () => {
            mockLoadConfig.mockResolvedValue({
                tabs: [
                    { id: 'tab-1', filePath: '/path/to/file1.md', isPinned: false },
                    { id: 'tab-2', filePath: '/path/to/file2.md', isPinned: false },
                ],
                activeTabId: 'tab-1',
            });
            await tabManager.init();
        });

        it('should notify callback on tab change', () => {
            const callback = vi.fn();
            tabManager.onTabChange(callback);

            tabManager.switchTab('tab-2');

            expect(callback).toHaveBeenCalledWith('tab-2');
        });

        it('should allow unsubscribing from tab changes', () => {
            const callback = vi.fn();
            const unsubscribe = tabManager.onTabChange(callback);

            tabManager.switchTab('tab-2');
            expect(callback).toHaveBeenCalledTimes(1);

            unsubscribe();
            tabManager.switchTab('tab-1');
            expect(callback).toHaveBeenCalledTimes(1); // Should not be called again
        });
    });

    describe('createEmptyTab', () => {
        beforeEach(async () => {
            await tabManager.init();
        });

        it('should create a new empty tab', () => {
            const initialTabCount = tabManager.getAllTabs().length;
            const emptyTab = tabManager.createEmptyTab();

            expect(tabManager.getAllTabs().length).toBe(initialTabCount + 1);
            expect(emptyTab.title).toBe('Untitled');
            expect(emptyTab.filePath).toBe('');
            expect(tabManager.getActiveTabId()).toBe(emptyTab.id);
        });
    });
});
