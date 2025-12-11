/**
 * ThemeManager Unit Tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

// Create mock functions with proper types
const mockListCustomThemes = vi.fn<() => Promise<string[]>>().mockResolvedValue([]);
const mockReadThemeManifest = vi.fn<(themeName: string) => Promise<string>>();
const mockReadThemeCss = vi.fn<(themeName: string, cssFile: string) => Promise<string>>();

// Mock dependencies
vi.mock('@inkdown/core/native', () => ({
    native: {
        fs: {
            listCustomThemes: mockListCustomThemes,
            readThemeManifest: mockReadThemeManifest,
            readThemeCss: mockReadThemeCss,
        },
    },
}));

// Create mock App
const createMockApp = () => ({
    configManager: {
        loadConfig: vi.fn().mockResolvedValue({
            theme: 'default-dark',
            colorScheme: 'dark',
        }),
        saveConfig: vi.fn().mockResolvedValue(undefined),
    },
    events: {
        emit: vi.fn(),
    },
});

const { ThemeManager } = await import('@inkdown/core/ThemeManager');

describe('ThemeManager', () => {
    let themeManager: InstanceType<typeof ThemeManager>;
    let mockApp: ReturnType<typeof createMockApp>;

    beforeEach(() => {
        vi.clearAllMocks();
        // Reset document classes
        document.documentElement.className = '';
        mockListCustomThemes.mockResolvedValue([]);
        mockApp = createMockApp();
        themeManager = new ThemeManager(mockApp as any);
    });

    describe('init', () => {
        it('should initialize with default dark theme', async () => {
            await themeManager.init();

            expect(themeManager.getCurrentTheme()).toBe('default-dark');
            expect(themeManager.getColorScheme()).toBe('dark');
        });

        it('should load config from configManager', async () => {
            await themeManager.init();

            expect(mockApp.configManager.loadConfig).toHaveBeenCalledWith('app');
        });

        it('should load custom themes', async () => {
            mockListCustomThemes.mockResolvedValue(['my-theme']);
            mockReadThemeManifest.mockResolvedValue(
                JSON.stringify({
                    name: 'My Theme',
                    author: 'Test Author',
                    version: '1.0.0',
                    modes: ['dark'],
                })
            );

            await themeManager.init();

            const themes = themeManager.getAvailableThemes();
            expect(themes.some((t) => t.id === 'my-theme')).toBe(true);
        });
    });

    describe('getAvailableThemes', () => {
        it('should include built-in themes', async () => {
            await themeManager.init();

            const themes = themeManager.getAvailableThemes();
            const themeIds = themes.map((t) => t.id);

            expect(themeIds).toContain('default-dark');
            expect(themeIds).toContain('default-light');
        });

        it('should mark built-in themes correctly', async () => {
            await themeManager.init();

            const themes = themeManager.getAvailableThemes();
            const defaultDark = themes.find((t) => t.id === 'default-dark');

            expect(defaultDark?.builtIn).toBe(true);
        });
    });

    describe('setColorScheme', () => {
        beforeEach(async () => {
            await themeManager.init();
        });

        it('should switch to light scheme', async () => {
            await themeManager.setColorScheme('light');

            expect(themeManager.getColorScheme()).toBe('light');
        });

        it('should switch to dark scheme', async () => {
            await themeManager.setColorScheme('light');
            await themeManager.setColorScheme('dark');

            expect(themeManager.getColorScheme()).toBe('dark');
        });

        it('should save preference to config', async () => {
            await themeManager.setColorScheme('light');

            expect(mockApp.configManager.saveConfig).toHaveBeenCalled();
        });
    });

    describe('setTheme', () => {
        beforeEach(async () => {
            await themeManager.init();
        });

        it('should change current theme', async () => {
            await themeManager.setTheme('default-light');

            expect(themeManager.getCurrentTheme()).toBe('default-light');
        });

        it('should handle unknown theme gracefully (no throw)', async () => {
            // setTheme doesn't throw - it logs error and returns
            await expect(themeManager.setTheme('nonexistent-theme')).resolves.toBeUndefined();
            // Theme should remain unchanged
            expect(themeManager.getCurrentTheme()).toBe('default-dark');
        });

        it('should save theme preference to config', async () => {
            await themeManager.setTheme('default-light');

            expect(mockApp.configManager.saveConfig).toHaveBeenCalled();
        });
    });

    describe('hasTheme', () => {
        beforeEach(async () => {
            await themeManager.init();
        });

        it('should return true for existing themes', () => {
            expect(themeManager.hasTheme('default-dark')).toBe(true);
            expect(themeManager.hasTheme('default-light')).toBe(true);
        });

        it('should return false for non-existing themes', () => {
            expect(themeManager.hasTheme('nonexistent')).toBe(false);
        });
    });
});
