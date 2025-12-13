/**
 * Vitest Test Setup
 *
 * Global setup, mocks, and utilities for unit tests.
 */

import { vi, beforeEach, afterEach } from 'vitest';
import '@testing-library/jest-dom/vitest';
import 'fake-indexeddb/auto'; // Polyfill IndexedDB for tests

// =============================================================================
// Global Mocks
// =============================================================================

/**
 * Mock the native module (Tauri bindings)
 * This prevents tests from making actual IPC calls
 */
vi.mock('@inkdown/core/native', () => ({
    native: {
        fs: {
            readFile: vi.fn().mockResolvedValue(''),
            writeFile: vi.fn().mockResolvedValue(undefined),
            exists: vi.fn().mockResolvedValue(false),
            readDir: vi.fn().mockResolvedValue([]),
            createDir: vi.fn().mockResolvedValue(undefined),
            removeFile: vi.fn().mockResolvedValue(undefined),
            removeDir: vi.fn().mockResolvedValue(undefined),
            rename: vi.fn().mockResolvedValue(undefined),
            copyFile: vi.fn().mockResolvedValue(undefined),
            ensureDir: vi.fn().mockResolvedValue(undefined),
            listCustomThemes: vi.fn().mockResolvedValue([]),
            readThemeManifest: vi.fn().mockResolvedValue('{}'),
            readThemeCss: vi.fn().mockResolvedValue(''),
        },
        config: {
            readConfigFile: vi.fn().mockResolvedValue(null),
            writeConfigFile: vi.fn().mockResolvedValue(undefined),
            configFileExists: vi.fn().mockResolvedValue(false),
            getConfigDir: vi.fn().mockResolvedValue('/mock/config/dir'),
        },
        dialog: {
            open: vi.fn().mockResolvedValue(null),
            save: vi.fn().mockResolvedValue(null),
            message: vi.fn().mockResolvedValue(undefined),
            confirm: vi.fn().mockResolvedValue(false),
        },
        clipboard: {
            readText: vi.fn().mockResolvedValue(''),
            writeText: vi.fn().mockResolvedValue(undefined),
        },
        platform: {
            platform: vi.fn().mockReturnValue('darwin'),
            arch: vi.fn().mockReturnValue('x64'),
        },
    },
}));

/**
 * Mock window/document APIs not available in Node
 */
const mockElement = {
    style: {},
    classList: {
        add: vi.fn(),
        remove: vi.fn(),
        toggle: vi.fn(),
        contains: vi.fn().mockReturnValue(false),
    },
    setAttribute: vi.fn(),
    getAttribute: vi.fn(),
    appendChild: vi.fn(),
    removeChild: vi.fn(),
    remove: vi.fn(),
    querySelector: vi.fn(),
    querySelectorAll: vi.fn().mockReturnValue([]),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    textContent: '',
    innerHTML: '',
    createEl: vi.fn().mockReturnThis(),
    createDiv: vi.fn().mockReturnThis(),
    addClass: vi.fn().mockReturnThis(),
    setText: vi.fn().mockReturnThis(),
    empty: vi.fn(),
};

vi.stubGlobal('document', {
    createElement: vi.fn().mockReturnValue({ ...mockElement }),
    createDiv: vi.fn().mockReturnValue({ ...mockElement }),
    getElementById: vi.fn().mockReturnValue(null),
    querySelector: vi.fn().mockReturnValue(null),
    querySelectorAll: vi.fn().mockReturnValue([]),
    documentElement: {
        ...mockElement,
        className: '',
    },
    head: {
        appendChild: vi.fn(),
        removeChild: vi.fn(),
    },
    body: {
        ...mockElement,
    },
});

vi.stubGlobal('window', {
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    setInterval: vi.fn().mockReturnValue(1),
    clearInterval: vi.fn(),
    setTimeout: vi.fn().mockReturnValue(1),
    clearTimeout: vi.fn(),
    requestAnimationFrame: vi.fn(),
    cancelAnimationFrame: vi.fn(),
    matchMedia: vi.fn().mockReturnValue({
        matches: false,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
    }),
    localStorage: {
        getItem: vi.fn(),
        setItem: vi.fn(),
        removeItem: vi.fn(),
        clear: vi.fn(),
    },
});

// =============================================================================
// Test Utilities
// =============================================================================

/**
 * Create a mock App instance for testing
 */
export function createMockApp() {
    return {
        configManager: {
            loadConfig: vi.fn().mockResolvedValue(null),
            saveConfig: vi.fn().mockResolvedValue(undefined),
            init: vi.fn().mockResolvedValue(undefined),
        },
        pluginManager: {
            registerPlugin: vi.fn(),
            loadPlugin: vi.fn().mockResolvedValue(true),
            enablePlugin: vi.fn().mockResolvedValue(undefined),
            disablePlugin: vi.fn().mockResolvedValue(undefined),
            isPluginEnabled: vi.fn().mockReturnValue(false),
            getPluginManifest: vi.fn(),
        },
        themeManager: {
            setTheme: vi.fn().mockResolvedValue(undefined),
            setColorScheme: vi.fn().mockResolvedValue(undefined),
            getAvailableThemes: vi.fn().mockReturnValue([]),
        },
        commandManager: {
            registerCommand: vi.fn(),
            unregisterCommand: vi.fn(),
            executeCommand: vi.fn(),
        },
        workspace: {
            getMarkdownFiles: vi.fn().mockResolvedValue([]),
            create: vi.fn().mockResolvedValue(undefined),
            read: vi.fn().mockResolvedValue(''),
            modify: vi.fn().mockResolvedValue(undefined),
            delete: vi.fn().mockResolvedValue(undefined),
        },
        editorRegistry: {
            getActive: vi.fn().mockReturnValue(null),
            register: vi.fn(),
            unregister: vi.fn(),
        },
        markdownProcessor: {
            registerCodeBlockProcessor: vi.fn(),
            unregisterCodeBlockProcessor: vi.fn(),
            registerPostProcessor: vi.fn(),
            unregisterPostProcessor: vi.fn(),
        },
        registerEditorSuggest: vi.fn(),
        unregisterEditorSuggest: vi.fn(),
    };
}

/**
 * Create a mock Plugin manifest
 */
export function createMockManifest(overrides = {}) {
    return {
        id: 'test-plugin',
        name: 'Test Plugin',
        version: '1.0.0',
        description: 'A test plugin',
        author: 'Test Author',
        ...overrides,
    };
}

/**
 * Wait for a condition to be true
 */
export async function waitFor(
    condition: () => boolean | Promise<boolean>,
    timeout = 1000,
    interval = 50
): Promise<void> {
    const start = Date.now();
    while (Date.now() - start < timeout) {
        if (await condition()) return;
        await new Promise((resolve) => setTimeout(resolve, interval));
    }
    throw new Error('waitFor timeout');
}

/**
 * Create a deferred promise for testing async flows
 */
export function createDeferred<T>() {
    let resolve: (value: T) => void;
    let reject: (error: Error) => void;
    const promise = new Promise<T>((res, rej) => {
        resolve = res;
        reject = rej;
    });
    return { promise, resolve: resolve!, reject: reject! };
}

// =============================================================================
// Global Hooks
// =============================================================================

beforeEach(() => {
    // Clear all mocks before each test
    vi.clearAllMocks();
});

afterEach(() => {
    // Reset modules between tests if needed
    // vi.resetModules();
});
