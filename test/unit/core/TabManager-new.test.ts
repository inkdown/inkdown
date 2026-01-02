import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createTestApp, destroyTestApp } from '../../utils/createTestApp';
import type { App } from '../../../packages/core/src/App';

describe('TabManager', () => {
    let app: App;

    beforeEach(async () => {
        app = await createTestApp();
    });

    afterEach(async () => {
        await destroyTestApp(app);
    });

    describe('init', () => {
        it('should create empty tab when no tabs in config', async () => {
            await app.tabManager.init();

            const tabs = app.tabManager.getAllTabs();
            expect(tabs.length).toBe(1);
            expect(tabs[0].title).toBe('Untitled');
            expect(tabs[0].filePath).toBe('');
        });

        it('should restore tabs from config', async () => {
            // First save config
            const tabsConfig = {
                tabs: [
                    { id: 'tab-1', filePath: '/path/to/file1.md', isPinned: false },
                    { id: 'tab-2', filePath: '/path/to/file2.md', isPinned: true },
                ],
                activeTabId: 'tab-2',
            };
            
            await app.configManager.saveConfig('app', tabsConfig);
            
            // Now reinitialize tabs to pick up the saved config
            await app.tabManager.init();

            const tabs = app.tabManager.getAllTabs();
            // After reloading, should have 2 tabs from config
            expect(tabs.length).toBeGreaterThanOrEqual(2);
            
            const tab1 = tabs.find(t => t.id === 'tab-1');
            const tab2 = tabs.find(t => t.id === 'tab-2');
            
            expect(tab1).toBeDefined();
            expect(tab1?.filePath).toBe('/path/to/file1.md');
            expect(tab2).toBeDefined();
            expect(tab2?.isPinned).toBe(true);
            expect(app.tabManager.getActiveTab()?.id).toBe('tab-2');
        });

        it('should skip empty tabs from config', async () => {
            const tabsConfig = {
                tabs: [
                    { id: 'tab-1', filePath: '/path/to/file1.md', isPinned: false },
                    { id: 'tab-2', filePath: '', isPinned: false },
                ],
                activeTabId: 'tab-1',
            };
            
            await app.configManager.saveConfig('app', tabsConfig);
            await app.tabManager.init();

            const tabs = app.tabManager.getAllTabs();
            // Should only have tab-1, tab-2 should be skipped
            const tab1 = tabs.find(t => t.id === 'tab-1');
            const tab2 = tabs.find(t => t.id === 'tab-2');
            
            expect(tab1).toBeDefined();
            expect(tab2).toBeUndefined();
        });
    });

    describe('openTab', () => {
        beforeEach(async () => {
            await app.tabManager.init();
        });

        it('should replace current tab content by default', async () => {
            await app.tabManager.openTab('/path/to/newfile.md');

            const tabs = app.tabManager.getAllTabs();
            expect(tabs.length).toBe(1);
            expect(tabs[0].filePath).toBe('/path/to/newfile.md');
        });

        it('should open in new tab when option is set', async () => {
            await app.tabManager.openTab('/path/to/newfile.md', { openInNewTab: true });

            const tabs = app.tabManager.getAllTabs();
            expect(tabs.length).toBe(2);
            expect(tabs[1].filePath).toBe('/path/to/newfile.md');
        });

        it('should switch to existing tab if file is already open', async () => {
            await app.tabManager.openTab('/path/to/file.md', { openInNewTab: true });
            const firstTabId = app.tabManager.getActiveTab()?.id;

            await app.tabManager.openTab('/path/to/another.md', { openInNewTab: true });
            expect(app.tabManager.getAllTabs().length).toBe(3);

            // Open first file again - should switch to existing tab
            await app.tabManager.openTab('/path/to/file.md');
            expect(app.tabManager.getActiveTab()?.id).toBe(firstTabId);
            expect(app.tabManager.getAllTabs().length).toBe(3); // No new tab created
        });
    });

    describe('closeTab', () => {
        beforeEach(async () => {
            await app.tabManager.init();
        });

        it('should close a tab and switch to next available', async () => {
            await app.tabManager.openTab('/path/to/file1.md', { openInNewTab: true });
            await app.tabManager.openTab('/path/to/file2.md', { openInNewTab: true });

            const tabs = app.tabManager.getAllTabs();
            expect(tabs.length).toBe(3);

            await app.tabManager.closeTab(tabs[1].id);
            expect(app.tabManager.getAllTabs().length).toBe(2);
        });

        it('should create empty tab when closing last tab', async () => {
            const tabs = app.tabManager.getAllTabs();
            await app.tabManager.closeTab(tabs[0].id);

            const newTabs = app.tabManager.getAllTabs();
            expect(newTabs.length).toBe(1);
            expect(newTabs[0].title).toBe('Untitled');
        });
    });

    describe('switchTab', () => {
        beforeEach(async () => {
            await app.tabManager.init();
            await app.tabManager.openTab('/path/to/file1.md', { openInNewTab: true });
            await app.tabManager.openTab('/path/to/file2.md', { openInNewTab: true });
        });

        it('should switch to specified tab', () => {
            const tabs = app.tabManager.getAllTabs();
            app.tabManager.switchTab(tabs[0].id);
            expect(app.tabManager.getActiveTab()?.id).toBe(tabs[0].id);
        });

        it('should handle switching to non-existent tab gracefully', () => {
            const before = app.tabManager.getActiveTab();
            app.tabManager.switchTab('non-existent-id');
            // Should remain on same tab
            expect(app.tabManager.getActiveTab()?.id).toBe(before?.id);
        });
    });

    describe('tab getters', () => {
        beforeEach(async () => {
            await app.tabManager.init();
        });

        it('should get active tab', () => {
            const activeTab = app.tabManager.getActiveTab();
            expect(activeTab).toBeDefined();
            expect(activeTab?.id).toBe(app.tabManager.getActiveTabId());
        });

        it('should get tab by ID', () => {
            const activeTab = app.tabManager.getActiveTab();
            const tab = app.tabManager.getTabById(activeTab!.id);
            expect(tab).toEqual(activeTab);
        });

        it('should return null for non-existent tab ID', () => {
            const tab = app.tabManager.getTabById('non-existent');
            expect(tab).toBeNull();
        });

        it('should get all tabs', () => {
            const tabs = app.tabManager.getAllTabs();
            expect(Array.isArray(tabs)).toBe(true);
            expect(tabs.length).toBeGreaterThan(0);
        });
    });

    describe('caching', () => {
        beforeEach(async () => {
            await app.tabManager.init();
        });

        it('should cache tab content', async () => {
            const activeTab = app.tabManager.getActiveTab();
            const content = {
                content: '# Hello World',
                scrollTop: 100,
                cursorPos: { line: 1, ch: 0 },
            };

            await app.tabManager.cacheTab(activeTab!.id, content);
            const cached = await app.tabManager.getCachedTab(activeTab!.id);
            
            expect(cached).toEqual(content);
        });

        it('should return null for non-existent cache', async () => {
            const cached = await app.tabManager.getCachedTab('non-existent');
            expect(cached).toBeNull();
        });

        it('should clear cache for a tab', async () => {
            const activeTab = app.tabManager.getActiveTab();
            const content = { content: '# Test', scrollTop: 0, cursorPos: { line: 0, ch: 0 } };

            await app.tabManager.cacheTab(activeTab!.id, content);
            await app.tabManager.clearCache(activeTab!.id);
            
            const cached = await app.tabManager.getCachedTab(activeTab!.id);
            expect(cached).toBeNull();
        });
    });

    describe('markTabDirty', () => {
        beforeEach(async () => {
            await app.tabManager.init();
        });

        it('should mark tab as dirty', () => {
            const activeTab = app.tabManager.getActiveTab();
            app.tabManager.markTabDirty(activeTab!.id, true);

            const tab = app.tabManager.getTabById(activeTab!.id);
            expect(tab?.isDirty).toBe(true);
        });

        it('should mark tab as not dirty', () => {
            const activeTab = app.tabManager.getActiveTab();
            app.tabManager.markTabDirty(activeTab!.id, true);
            app.tabManager.markTabDirty(activeTab!.id, false);

            const tab = app.tabManager.getTabById(activeTab!.id);
            expect(tab?.isDirty).toBe(false);
        });
    });
});
