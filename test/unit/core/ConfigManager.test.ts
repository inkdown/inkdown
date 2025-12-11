/**
 * ConfigManager Unit Tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

// Create mock functions with proper types
const mockReadConfigFile = vi.fn<(fileName: string) => Promise<string>>();
const mockWriteConfigFile = vi.fn<(fileName: string, content: string) => Promise<void>>();
const mockGetConfigDir = vi.fn<() => Promise<string>>().mockResolvedValue('/mock/config');

// Mock native module before importing ConfigManager
vi.mock('@inkdown/core/native', () => ({
    native: {
        config: {
            readConfigFile: mockReadConfigFile,
            writeConfigFile: mockWriteConfigFile,
            getConfigDir: mockGetConfigDir,
        },
    },
}));

// Import after mocking
const { ConfigManager } = await import('@inkdown/core/ConfigManager');

describe('ConfigManager', () => {
    let configManager: InstanceType<typeof ConfigManager>;

    beforeEach(() => {
        vi.clearAllMocks();
        localStorage.clear();
        mockGetConfigDir.mockResolvedValue('/mock/config');
        configManager = new ConfigManager();
    });

    describe('init', () => {
        it('should initialize and get config directory', async () => {
            await configManager.init();
            expect(mockGetConfigDir).toHaveBeenCalled();
        });

        it('should handle config directory errors gracefully', async () => {
            mockGetConfigDir.mockRejectedValueOnce(new Error('Failed'));
            await expect(configManager.init()).resolves.not.toThrow();
        });
    });

    describe('loadConfig', () => {
        it('should return cached config from localStorage if available', async () => {
            const mockConfig = { theme: 'default-dark', colorScheme: 'dark' };
            localStorage.setItem('inkdown_config_app', JSON.stringify(mockConfig));

            const result = await configManager.loadConfig('app');

            expect(result).toEqual(mockConfig);
            // Should not call native file read since cache hit
            expect(mockReadConfigFile).not.toHaveBeenCalled();
        });

        it('should load from file when not in localStorage', async () => {
            const mockConfig = { theme: 'custom', fontSize: 14 };
            mockReadConfigFile.mockResolvedValue(JSON.stringify(mockConfig));

            const result = await configManager.loadConfig('settings');

            expect(result).toEqual(mockConfig);
            expect(mockReadConfigFile).toHaveBeenCalledWith('settings.json');
        });

        it('should cache file data to localStorage after loading', async () => {
            const mockConfig = { theme: 'custom' };
            mockReadConfigFile.mockResolvedValue(JSON.stringify(mockConfig));

            await configManager.loadConfig('settings');

            const cached = localStorage.getItem('inkdown_config_settings');
            expect(cached).toBe(JSON.stringify(mockConfig));
        });

        it('should return default config when file does not exist', async () => {
            mockReadConfigFile.mockRejectedValue(new Error('File not found'));

            const result = await configManager.loadConfig<{ theme: string }>('app');

            // Should return default app config
            expect(result).toHaveProperty('theme');
            expect(result).toHaveProperty('tabs');
        });
    });

    describe('saveConfig', () => {
        beforeEach(async () => {
            await configManager.init();
        });

        it('should save config to both cache and file', async () => {
            const config = { theme: 'custom', fontSize: 14 };
            mockWriteConfigFile.mockResolvedValue(undefined);

            await configManager.saveConfig('app', config);

            // Check localStorage cache
            const cached = localStorage.getItem('inkdown_config_app');
            expect(cached).toBe(JSON.stringify(config));

            // Check file write
            expect(mockWriteConfigFile).toHaveBeenCalledWith(
                'app.json',
                JSON.stringify(config, null, 2)
            );
        });

        it('should throw error when file save fails', async () => {
            const error = new Error('Write failed');
            mockWriteConfigFile.mockRejectedValue(error);

            await expect(configManager.saveConfig('app', {})).rejects.toThrow('Write failed');
        });

        it('should still cache even if file write fails', async () => {
            const config = { theme: 'test' };
            mockWriteConfigFile.mockRejectedValue(new Error('Write failed'));

            try {
                await configManager.saveConfig('app', config);
            } catch {
                // Expected to throw
            }

            // Should still be in cache
            const cached = localStorage.getItem('inkdown_config_app');
            expect(cached).toBe(JSON.stringify(config));
        });
    });

    describe('caching strategy', () => {
        it('should prefer localStorage cache over file', async () => {
            const cachedConfig = { source: 'cache' };
            const fileConfig = { source: 'file' };

            localStorage.setItem('inkdown_config_test', JSON.stringify(cachedConfig));
            mockReadConfigFile.mockResolvedValue(JSON.stringify(fileConfig));

            const result = await configManager.loadConfig('test');

            expect(result).toEqual(cachedConfig);
            expect(mockReadConfigFile).not.toHaveBeenCalled();
        });
    });
});
