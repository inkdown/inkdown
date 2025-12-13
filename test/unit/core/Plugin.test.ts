import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Plugin } from '@inkdown/core/Plugin';
import type { App } from '@inkdown/core/App';
import type { PluginManifest, Command } from '@inkdown/core/types/plugin';
import type { PluginSettingTab } from '@inkdown/core/components/PluginSettingTab';

// Concrete implementation for testing
class TestPlugin extends Plugin {
    onloadCalled = false;
    onunloadCalled = false;

    async onload(): Promise<void> {
        this.onloadCalled = true;
    }

    async onunload(): Promise<void> {
        this.onunloadCalled = true;
    }
}

describe('Plugin', () => {
    let plugin: TestPlugin;
    let mockApp: App;
    let manifest: PluginManifest;

    const mockRegisterCommand = vi.fn();
    const mockUnregisterCommand = vi.fn();
    const mockRegisterView = vi.fn();
    const mockGetPluginSettings = vi.fn<(id: string) => Promise<any>>();
    const mockSavePluginSettings = vi.fn<(id: string, data: any) => Promise<void>>();
    const mockRegisterEditorSuggest = vi.fn();
    const mockUnregisterEditorSuggest = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();

        manifest = {
            id: 'test-plugin',
            name: 'Test Plugin',
            version: '1.0.0',
            description: 'A test plugin',
            author: 'Test Author',
        };

        mockApp = {
            commandManager: {
                registerCommand: mockRegisterCommand,
                unregisterCommand: mockUnregisterCommand,
            },
            workspaceUI: {
                registerView: mockRegisterView,
            },
            pluginManager: {
                getPluginSettings: mockGetPluginSettings,
                savePluginSettings: mockSavePluginSettings,
            },
            editorRegistry: null,
            markdownProcessor: null,
            registerEditorSuggest: mockRegisterEditorSuggest,
            unregisterEditorSuggest: mockUnregisterEditorSuggest,
        } as unknown as App;

        plugin = new TestPlugin(mockApp, manifest);
    });

    describe('constructor', () => {
        it('should initialize with app and manifest', () => {
            expect(plugin.app).toBe(mockApp);
            expect(plugin.manifest).toBe(manifest);
        });

        it('should be disabled by default', () => {
            expect(plugin.enabled).toBe(false);
        });

        it('should have empty commands map initially', () => {
            expect(plugin.getCommands()).toEqual([]);
        });

        it('should have empty views map initially', () => {
            expect(plugin.getViews().size).toBe(0);
        });

        it('should have empty setting tabs initially', () => {
            expect(plugin.getSettingTabs()).toEqual([]);
        });
    });

    describe('loadData', () => {
        it('should load data from pluginManager', async () => {
            const testData = { setting1: 'value1' };
            mockGetPluginSettings.mockResolvedValue(testData);

            const result = await plugin.loadData();

            expect(mockGetPluginSettings).toHaveBeenCalledWith('test-plugin');
            expect(result).toEqual(testData);
        });

        it('should return undefined on error', async () => {
            mockGetPluginSettings.mockRejectedValue(new Error('Failed'));

            const result = await plugin.loadData();

            expect(result).toBeUndefined();
        });

        it('should work with generic type', async () => {
            interface TestSettings {
                setting1: string;
                setting2: number;
            }
            const testData: TestSettings = { setting1: 'value', setting2: 42 };
            mockGetPluginSettings.mockResolvedValue(testData);

            const result = await plugin.loadData<TestSettings>();

            expect(result?.setting1).toBe('value');
            expect(result?.setting2).toBe(42);
        });
    });

    describe('saveData', () => {
        it('should save data via pluginManager', async () => {
            mockSavePluginSettings.mockResolvedValue(undefined);
            const testData = { setting1: 'value1' };

            await plugin.saveData(testData);

            expect(mockSavePluginSettings).toHaveBeenCalledWith('test-plugin', testData);
        });

        it('should throw error on save failure', async () => {
            mockSavePluginSettings.mockRejectedValue(new Error('Save failed'));

            await expect(plugin.saveData({ data: 'test' })).rejects.toThrow('Save failed');
        });
    });

    describe('addCommand / registerCommand', () => {
        it('should register a command with commandManager', () => {
            const command: Command = {
                id: 'test-command',
                name: 'Test Command',
                callback: () => {},
            };

            plugin.addCommand(command);

            expect(mockRegisterCommand).toHaveBeenCalledWith(command, 'plugin', 'test-plugin');
        });

        it('should return the registered command', () => {
            const command: Command = {
                id: 'test-command',
                name: 'Test Command',
                callback: () => {},
            };

            const result = plugin.addCommand(command);

            expect(result).toBe(command);
        });

        it('should track commands for cleanup', () => {
            const command: Command = {
                id: 'test-command',
                name: 'Test Command',
                callback: () => {},
            };

            plugin.addCommand(command);

            const commands = plugin.getCommands();
            expect(commands).toContain(command);
        });

        it('should support registerCommand method', () => {
            const command: Command = {
                id: 'test-command',
                name: 'Test Command',
                callback: () => {},
            };

            plugin.registerCommand(command);

            expect(mockRegisterCommand).toHaveBeenCalledWith(command, 'plugin', 'test-plugin');
        });

        it('should handle multiple commands', () => {
            plugin.addCommand({ id: 'cmd-1', name: 'Cmd 1', callback: () => {} });
            plugin.addCommand({ id: 'cmd-2', name: 'Cmd 2', callback: () => {} });
            plugin.addCommand({ id: 'cmd-3', name: 'Cmd 3', callback: () => {} });

            expect(plugin.getCommands().length).toBe(3);
        });
    });

    describe('registerView', () => {
        it('should register a view with workspaceUI', () => {
            const viewCreator = vi.fn();

            plugin.registerView('test-view', viewCreator);

            expect(mockRegisterView).toHaveBeenCalledWith('test-view', viewCreator);
        });

        it('should track views', () => {
            const viewCreator = vi.fn();

            plugin.registerView('test-view', viewCreator);

            const views = plugin.getViews();
            expect(views.get('test-view')).toBe(viewCreator);
        });

        it('should handle multiple views', () => {
            plugin.registerView('view-1', vi.fn());
            plugin.registerView('view-2', vi.fn());

            expect(plugin.getViews().size).toBe(2);
        });
    });

    describe('addSettingTab', () => {
        it('should add a setting tab', () => {
            const mockTab = { hide: vi.fn() } as unknown as PluginSettingTab;

            plugin.addSettingTab(mockTab);

            expect(plugin.getSettingTabs()).toContain(mockTab);
        });

        it('should support registerSettingTab alias', () => {
            const mockTab = { hide: vi.fn() } as unknown as PluginSettingTab;

            plugin.registerSettingTab(mockTab);

            expect(plugin.getSettingTabs()).toContain(mockTab);
        });

        it('should handle multiple setting tabs', () => {
            plugin.addSettingTab({ hide: vi.fn() } as unknown as PluginSettingTab);
            plugin.addSettingTab({ hide: vi.fn() } as unknown as PluginSettingTab);

            expect(plugin.getSettingTabs().length).toBe(2);
        });
    });

    describe('registerEditorSuggest', () => {
        it('should register suggest with app', () => {
            const mockSuggest = { type: 'suggest' };

            plugin.registerEditorSuggest(mockSuggest);

            expect(mockRegisterEditorSuggest).toHaveBeenCalledWith(mockSuggest);
        });
    });

    describe('registerEvent', () => {
        it('should register unload callback', async () => {
            const cleanup = vi.fn();
            plugin.registerEvent(cleanup);

            await plugin._cleanup();

            expect(cleanup).toHaveBeenCalled();
        });

        it('should handle multiple event callbacks', async () => {
            const cleanup1 = vi.fn();
            const cleanup2 = vi.fn();
            plugin.registerEvent(cleanup1);
            plugin.registerEvent(cleanup2);

            await plugin._cleanup();

            expect(cleanup1).toHaveBeenCalled();
            expect(cleanup2).toHaveBeenCalled();
        });
    });

    describe('_cleanup', () => {
        it('should unregister all commands', async () => {
            plugin.addCommand({ id: 'cmd-1', name: 'Cmd 1', callback: () => {} });
            plugin.addCommand({ id: 'cmd-2', name: 'Cmd 2', callback: () => {} });

            await plugin._cleanup();

            expect(mockUnregisterCommand).toHaveBeenCalledWith('cmd-1');
            expect(mockUnregisterCommand).toHaveBeenCalledWith('cmd-2');
        });

        it('should clear all commands', async () => {
            plugin.addCommand({ id: 'cmd-1', name: 'Cmd 1', callback: () => {} });

            await plugin._cleanup();

            expect(plugin.getCommands().length).toBe(0);
        });

        it('should clear all views', async () => {
            plugin.registerView('view-1', vi.fn());

            await plugin._cleanup();

            expect(plugin.getViews().size).toBe(0);
        });

        it('should hide and clear setting tabs', async () => {
            const mockTab = { hide: vi.fn() } as unknown as PluginSettingTab;
            plugin.addSettingTab(mockTab);

            await plugin._cleanup();

            expect(mockTab.hide).toHaveBeenCalled();
            expect(plugin.getSettingTabs().length).toBe(0);
        });

        it('should ignore errors when hiding setting tabs', async () => {
            const mockTab = {
                hide: vi.fn().mockImplementation(() => {
                    throw new Error('Hide failed');
                }),
            } as unknown as PluginSettingTab;
            plugin.addSettingTab(mockTab);

            // Should not throw
            await plugin._cleanup();

            expect(plugin.getSettingTabs().length).toBe(0);
        });

        it('should call all registered event cleanup callbacks', async () => {
            const cleanup1 = vi.fn();
            const cleanup2 = vi.fn();
            plugin.registerEvent(cleanup1);
            plugin.registerEvent(cleanup2);

            await plugin._cleanup();

            expect(cleanup1).toHaveBeenCalled();
            expect(cleanup2).toHaveBeenCalled();
        });

        it('should handle errors in event cleanup gracefully', async () => {
            plugin.registerEvent(() => {
                throw new Error('Cleanup error');
            });

            // Should not throw
            await plugin._cleanup();
        });
    });

    describe('lifecycle', () => {
        it('should call onload when load is called', () => {
            plugin.load();

            expect(plugin.onloadCalled).toBe(true);
        });

        it('should call onunload when unload is called', () => {
            plugin.load();
            plugin.unload();

            expect(plugin.onunloadCalled).toBe(true);
        });

        it('should not call onload twice', () => {
            plugin.load();
            plugin.onloadCalled = false;
            plugin.load();

            expect(plugin.onloadCalled).toBe(false);
        });

        it('should not call onunload if not loaded', () => {
            plugin.unload();

            expect(plugin.onunloadCalled).toBe(false);
        });
    });

    describe('manifest', () => {
        it('should have correct manifest properties', () => {
            expect(plugin.manifest.id).toBe('test-plugin');
            expect(plugin.manifest.name).toBe('Test Plugin');
            expect(plugin.manifest.version).toBe('1.0.0');
            expect(plugin.manifest.description).toBe('A test plugin');
            expect(plugin.manifest.author).toBe('Test Author');
        });
    });
});
