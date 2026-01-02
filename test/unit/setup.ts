/**
 * Vitest Test Setup
 *
 * Global setup, mocks, and utilities for unit tests.
 */

import { vi, beforeEach, afterEach } from 'vitest';
import '@testing-library/jest-dom/vitest';
import 'fake-indexeddb/auto'; // Polyfill IndexedDB for tests
import { IDBFactory } from 'fake-indexeddb';

// =============================================================================
// Global Mocks
// =============================================================================

/**
 * In-memory config storage for tests
 * This simulates the file system behavior
 */
const mockConfigStorage = new Map<string, string>();

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
            readConfigFile: vi.fn().mockImplementation(async (fileName: string) => {
                const content = mockConfigStorage.get(fileName);
                if (!content) {
                    throw new Error(`Config file not found: ${fileName}`);
                }
                return content;
            }),
            writeConfigFile: vi.fn().mockImplementation(async (fileName: string, content: string) => {
                mockConfigStorage.set(fileName, content);
            }),
            configFileExists: vi.fn().mockImplementation(async (fileName: string) => {
                return mockConfigStorage.has(fileName);
            }),
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
const createMockElement = (): any => ({
    style: {},
    id: '',
    className: '',
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
    createEl: vi.fn(function() { return createMockElement(); }),
    createDiv: vi.fn(function() { return createMockElement(); }),
    addClass: vi.fn(function() { return this; }),
    setText: vi.fn(function() { return this; }),
    empty: vi.fn(),
});

// Note: jsdom already provides document, but we need to ensure createElement works
// We should NOT stubGlobal document in jsdom environment
// Instead, let jsdom handle it naturally

// Extend HTMLElement prototype with helper methods
if (typeof HTMLElement !== 'undefined') {
    HTMLElement.prototype.createEl = function(tag: string, options?: any) {
        const el = document.createElement(tag);
        if (options?.cls) {
            el.className = options.cls;
        }
        if (options?.text) {
            el.textContent = options.text;
        }
        if (options?.attr) {
            for (const [key, value] of Object.entries(options.attr)) {
                el.setAttribute(key, value as string);
            }
        }
        this.appendChild(el);
        return el;
    };
    
    HTMLElement.prototype.createDiv = function(options?: any) {
        return this.createEl('div', options);
    };
    
    HTMLElement.prototype.addClass = function(className: string) {
        this.classList.add(className);
        return this;
    };
    
    HTMLElement.prototype.setText = function(text: string) {
        this.textContent = text;
        return this;
    };
    
    HTMLElement.prototype.empty = function() {
        this.innerHTML = '';
    };
}

// Also add to Document.prototype
if (typeof Document !== 'undefined') {
    Document.prototype.createEl = function(tag: string, options?: any) {
        const el = document.createElement(tag);
        if (options?.cls) {
            el.className = options.cls;
        }
        if (options?.text) {
            el.textContent = options.text;
        }
        if (options?.attr) {
            for (const [key, value] of Object.entries(options.attr)) {
                el.setAttribute(key, value as string);
            }
        }
        return el;
    };
    
    Document.prototype.createDiv = function(options?: any) {
        return this.createEl('div', options);
    };
}

vi.stubGlobal('window', {
    ...global.window,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    setInterval: vi.fn((...args: any[]) => global.setInterval(...args)),
    clearInterval: vi.fn((...args: any[]) => global.clearInterval(...args)),
    setTimeout: vi.fn((...args: any[]) => global.setTimeout(...args)),
    clearTimeout: vi.fn((...args: any[]) => global.clearTimeout(...args)),
    requestAnimationFrame: vi.fn((cb) => global.setTimeout(cb, 16)),
    cancelAnimationFrame: vi.fn(),
    matchMedia: vi.fn().mockReturnValue({
        matches: false,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
    }),
    localStorage: global.localStorage,
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
    
    // Reset IndexedDB for each test
    global.indexedDB = new IDBFactory();
    
    // Clear config storage
    mockConfigStorage.clear();
    
    // Clear localStorage
    localStorage.clear();
});

afterEach(async () => {
    // Close and delete all IndexedDB databases
    try {
        const dbs = await indexedDB.databases();
        for (const dbInfo of dbs) {
            if (dbInfo.name) {
                indexedDB.deleteDatabase(dbInfo.name);
            }
        }
    } catch (error) {
        // Ignore errors during cleanup
    }
    
    // Reset IndexedDB for next test
    global.indexedDB = new IDBFactory();
    
    // Clear config storage
    mockConfigStorage.clear();
    
    // Clear localStorage
    localStorage.clear();
});
