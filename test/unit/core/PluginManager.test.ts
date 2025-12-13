import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock logger
vi.mock('../../../packages/core/src/utils/logger', () => ({
    createLogger: () => ({
        debug: vi.fn(),
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
    }),
}));

// Mock ConfigManager
const mockLoadConfig = vi.fn<() => Promise<any>>();
const mockSaveConfig = vi.fn<() => Promise<void>>();

// Create mock app
const createMockApp = () => ({
    configManager: {
        loadConfig: mockLoadConfig,
        saveConfig: mockSaveConfig,
    },
});

// Import after mocks
import { PluginManager, type PluginInfo } from '../../../packages/core/src/PluginManager';
import type { App } from '../../../packages/core/src/App';
import type { PluginManifest } from '../../../packages/core/src/types/plugin';

// Helper to create a valid manifest with required fields
const createManifest = (id: string, name?: string): PluginManifest => ({
    id,
    name: name || id,
    version: '1.0.0',
    description: 'Test plugin',
    author: 'Test Author',
});

// Create mock plugin class factory
const createMockPluginClass = () => {
    return class MockPlugin {
        app: App;
        manifest: PluginManifest;
        enabled = false;

        constructor(app: App, m: PluginManifest) {
            this.app = app;
            this.manifest = m;
        }

        onload = vi.fn().mockResolvedValue(undefined);
        onunload = vi.fn().mockResolvedValue(undefined);
        _cleanup = vi.fn().mockResolvedValue(undefined);
        getSettingTabs = vi.fn().mockReturnValue([]);
    };
};

describe('PluginManager', () => {
    let pluginManager: PluginManager;
    let mockApp: ReturnType<typeof createMockApp>;

    beforeEach(() => {
        vi.clearAllMocks();
        mockLoadConfig.mockResolvedValue({ plugins: [] });
        mockSaveConfig.mockResolvedValue(undefined);
        mockApp = createMockApp();
        pluginManager = new PluginManager(mockApp as unknown as App);
    });

    describe('registerPlugin', () => {
        it('should register a plugin', () => {
            const manifest = createManifest('test-plugin', 'Test Plugin');
            const info: PluginInfo = {
                manifest,
                loader: async () => ({ default: createMockPluginClass() as any }),
            };

            pluginManager.registerPlugin(info);

            expect(pluginManager.getRegisteredPluginIds()).toContain('test-plugin');
            expect(pluginManager.getPluginManifest('test-plugin')).toEqual(manifest);
        });

        it('should mark built-in plugins', () => {
            const manifest = createManifest('built-in-plugin', 'Built-in');
            const info: PluginInfo = {
                manifest,
                isBuiltIn: true,
                loader: async () => ({ default: createMockPluginClass() as any }),
            };

            pluginManager.registerPlugin(info);

            expect(pluginManager.isBuiltIn('built-in-plugin')).toBe(true);
        });

        it('should not mark user plugins as built-in', () => {
            const manifest = createManifest('user-plugin', 'User');
            const info: PluginInfo = {
                manifest,
                isBuiltIn: false,
                loader: async () => ({ default: createMockPluginClass() as any }),
            };

            pluginManager.registerPlugin(info);

            expect(pluginManager.isBuiltIn('user-plugin')).toBe(false);
        });
    });

    describe('unregisterPlugin', () => {
        it('should unregister a plugin', () => {
            const manifest = createManifest('test-plugin', 'Test');
            const info: PluginInfo = {
                manifest,
                loader: async () => ({ default: createMockPluginClass() as any }),
            };

            pluginManager.registerPlugin(info);
            expect(pluginManager.getRegisteredPluginIds()).toContain('test-plugin');

            pluginManager.unregisterPlugin('test-plugin');
            expect(pluginManager.getRegisteredPluginIds()).not.toContain('test-plugin');
        });
    });

    describe('loadPlugin', () => {
        it('should load a registered plugin', async () => {
            const manifest = createManifest('test-plugin', 'Test');
            const MockClass = createMockPluginClass();
            const info: PluginInfo = {
                manifest,
                loader: async () => ({ default: MockClass as any }),
            };

            pluginManager.registerPlugin(info);
            const result = await pluginManager.loadPlugin('test-plugin');

            expect(result).toBe(true);
            expect(pluginManager.getPlugin('test-plugin')).toBeDefined();
        });

        it('should return false for unregistered plugin', async () => {
            const result = await pluginManager.loadPlugin('nonexistent');

            expect(result).toBe(false);
        });

        it('should not load already loaded plugin', async () => {
            const manifest = createManifest('test-plugin', 'Test');
            const loaderSpy = vi.fn().mockResolvedValue({ default: createMockPluginClass() });
            const info: PluginInfo = {
                manifest,
                loader: loaderSpy,
            };

            pluginManager.registerPlugin(info);
            await pluginManager.loadPlugin('test-plugin');
            await pluginManager.loadPlugin('test-plugin'); // Load again

            expect(loaderSpy).toHaveBeenCalledTimes(1);
        });

        it('should return false on loader error', async () => {
            const manifest = createManifest('broken-plugin', 'Broken');
            const info: PluginInfo = {
                manifest,
                loader: async () => { throw new Error('Load failed'); },
            };

            pluginManager.registerPlugin(info);
            const result = await pluginManager.loadPlugin('broken-plugin');

            expect(result).toBe(false);
        });
    });

    describe('enablePlugin / disablePlugin', () => {
        let manifest: PluginManifest;
        let MockClass: ReturnType<typeof createMockPluginClass>;

        beforeEach(async () => {
            manifest = createManifest('test-plugin', 'Test');
            MockClass = createMockPluginClass();
            const info: PluginInfo = {
                manifest,
                loader: async () => ({ default: MockClass as any }),
            };

            pluginManager.registerPlugin(info);
            await pluginManager.loadPlugin('test-plugin');
        });

        it('should enable a plugin', async () => {
            await pluginManager.enablePlugin('test-plugin');

            const plugin = pluginManager.getPlugin('test-plugin');
            expect(plugin?.enabled).toBe(true);
            expect(pluginManager.isPluginEnabled('test-plugin')).toBe(true);
        });

        it('should call onload when enabling', async () => {
            await pluginManager.enablePlugin('test-plugin');

            const plugin = pluginManager.getPlugin('test-plugin') as any;
            expect(plugin.onload).toHaveBeenCalled();
        });

        it('should disable a plugin', async () => {
            await pluginManager.enablePlugin('test-plugin');
            await pluginManager.disablePlugin('test-plugin');

            const plugin = pluginManager.getPlugin('test-plugin');
            expect(plugin?.enabled).toBe(false);
            expect(pluginManager.isPluginEnabled('test-plugin')).toBe(false);
        });

        it('should call onunload and _cleanup when disabling', async () => {
            await pluginManager.enablePlugin('test-plugin');
            await pluginManager.disablePlugin('test-plugin');

            const plugin = pluginManager.getPlugin('test-plugin') as any;
            expect(plugin.onunload).toHaveBeenCalled();
            expect(plugin._cleanup).toHaveBeenCalled();
        });

        it('should save config when enabling', async () => {
            await pluginManager.enablePlugin('test-plugin');

            expect(mockSaveConfig).toHaveBeenCalled();
        });

        it('should not save config when enabling with save=false', async () => {
            mockSaveConfig.mockClear();
            await pluginManager.enablePlugin('test-plugin', false);

            expect(mockSaveConfig).not.toHaveBeenCalled();
        });
    });

    describe('togglePlugin', () => {
        beforeEach(async () => {
            const manifest = createManifest('toggle-plugin', 'Toggle');
            const info: PluginInfo = {
                manifest,
                loader: async () => ({ default: createMockPluginClass() as any }),
            };

            pluginManager.registerPlugin(info);
            await pluginManager.loadPlugin('toggle-plugin');
        });

        it('should enable disabled plugin', async () => {
            const result = await pluginManager.togglePlugin('toggle-plugin');

            expect(result).toBe(true);
            expect(pluginManager.isPluginEnabled('toggle-plugin')).toBe(true);
        });

        it('should disable enabled plugin', async () => {
            await pluginManager.enablePlugin('toggle-plugin');

            const result = await pluginManager.togglePlugin('toggle-plugin');

            expect(result).toBe(false);
            expect(pluginManager.isPluginEnabled('toggle-plugin')).toBe(false);
        });

        it('should return false for non-existent plugin', async () => {
            const result = await pluginManager.togglePlugin('nonexistent');

            expect(result).toBe(false);
        });
    });

    describe('plugin settings', () => {
        beforeEach(async () => {
            const manifest = createManifest('settings-plugin', 'Settings');
            const info: PluginInfo = {
                manifest,
                loader: async () => ({ default: createMockPluginClass() as any }),
            };

            pluginManager.registerPlugin(info);
            await pluginManager.loadPlugin('settings-plugin');
        });

        it('should save plugin settings', async () => {
            const settings = { option1: true, option2: 'value' };
            await pluginManager.savePluginSettings('settings-plugin', settings);

            expect(mockSaveConfig).toHaveBeenCalled();
        });

        it('should retrieve plugin settings', async () => {
            const settings = { option1: true, option2: 'value' };
            await pluginManager.savePluginSettings('settings-plugin', settings);

            const retrieved = pluginManager.getPluginSettings('settings-plugin');
            expect(retrieved).toEqual(settings);
        });
    });

    describe('onPluginChange', () => {
        beforeEach(async () => {
            const manifest = createManifest('listener-plugin', 'Listener');
            const info: PluginInfo = {
                manifest,
                loader: async () => ({ default: createMockPluginClass() as any }),
            };

            pluginManager.registerPlugin(info);
            await pluginManager.loadPlugin('listener-plugin');
        });

        it('should notify listeners when plugin is enabled', async () => {
            const listener = vi.fn();
            pluginManager.onPluginChange(listener);

            await pluginManager.enablePlugin('listener-plugin');

            expect(listener).toHaveBeenCalledWith('listener-plugin', 'enabled');
        });

        it('should notify listeners when plugin is disabled', async () => {
            const listener = vi.fn();
            pluginManager.onPluginChange(listener);

            await pluginManager.enablePlugin('listener-plugin');
            listener.mockClear();

            await pluginManager.disablePlugin('listener-plugin');

            expect(listener).toHaveBeenCalledWith('listener-plugin', 'disabled');
        });

        it('should notify listeners when settings change', async () => {
            const listener = vi.fn();
            pluginManager.onPluginChange(listener);

            await pluginManager.savePluginSettings('listener-plugin', { test: true });

            expect(listener).toHaveBeenCalledWith('listener-plugin', 'settings-changed');
        });

        it('should allow unsubscribing', async () => {
            const listener = vi.fn();
            const unsubscribe = pluginManager.onPluginChange(listener);

            unsubscribe();
            await pluginManager.enablePlugin('listener-plugin');

            expect(listener).not.toHaveBeenCalled();
        });
    });

    describe('plugin queries', () => {
        beforeEach(async () => {
            const pluginIds = ['plugin-1', 'plugin-2', 'plugin-3'];

            for (const id of pluginIds) {
                const manifest = createManifest(id);
                pluginManager.registerPlugin({
                    manifest,
                    loader: async () => ({ default: createMockPluginClass() as any }),
                });
                await pluginManager.loadPlugin(id);
            }

            // Enable only plugins 1 and 3
            await pluginManager.enablePlugin('plugin-1');
            await pluginManager.enablePlugin('plugin-3');
        });

        it('should get all plugins', () => {
            const allPlugins = pluginManager.getAllPlugins();
            expect(allPlugins.length).toBe(3);
        });

        it('should get enabled plugins only', () => {
            const enabledPlugins = pluginManager.getEnabledPlugins();
            expect(enabledPlugins.length).toBe(2);
            expect(enabledPlugins.map(p => p.manifest.id)).toEqual(['plugin-1', 'plugin-3']);
        });

        it('should check if plugin is enabled', () => {
            expect(pluginManager.isPluginEnabled('plugin-1')).toBe(true);
            expect(pluginManager.isPluginEnabled('plugin-2')).toBe(false);
            expect(pluginManager.isPluginEnabled('plugin-3')).toBe(true);
        });
    });

    describe('unloadAllPlugins', () => {
        beforeEach(async () => {
            const pluginIds = ['unload-1', 'unload-2'];

            for (const id of pluginIds) {
                const manifest = createManifest(id);
                pluginManager.registerPlugin({
                    manifest,
                    loader: async () => ({ default: createMockPluginClass() as any }),
                });
                await pluginManager.loadPlugin(id);
            }

            await pluginManager.enablePlugin('unload-1');
            await pluginManager.enablePlugin('unload-2');
        });

        it('should unload all plugins', async () => {
            await pluginManager.unloadAllPlugins();

            expect(pluginManager.getAllPlugins().length).toBe(0);
            expect(pluginManager.getEnabledPlugins().length).toBe(0);
        });
    });
});
