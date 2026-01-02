/**
 * Smoke Test Setup
 *
 * Setup and utilities specifically for smoke tests.
 * Smoke tests use React Testing Library to render components and test user interactions.
 */

import { vi, beforeEach, afterEach, beforeAll, afterAll } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import 'fake-indexeddb/auto';

// =============================================================================
// Mock Tauri APIs
// =============================================================================

/**
 * Mock Tauri core invoke function
 */
vi.mock('@tauri-apps/api/core', () => ({
    invoke: vi.fn().mockImplementation((cmd: string, _args?: unknown) => {
        // Return sensible defaults for common commands
        switch (cmd) {
            case 'get_config_dir':
                return Promise.resolve('/mock/config');
            case 'read_file':
                return Promise.resolve('');
            case 'write_file':
                return Promise.resolve();
            case 'file_exists':
                return Promise.resolve(false);
            case 'read_dir':
                return Promise.resolve([]);
            case 'create_dir':
                return Promise.resolve();
            default:
                return Promise.resolve(null);
        }
    }),
}));

/**
 * Mock Tauri dialog plugin
 */
vi.mock('@tauri-apps/plugin-dialog', () => ({
    open: vi.fn().mockResolvedValue(null),
    save: vi.fn().mockResolvedValue(null),
    ask: vi.fn().mockResolvedValue(false),
    message: vi.fn().mockResolvedValue(undefined),
    confirm: vi.fn().mockResolvedValue(false),
}));

/**
 * Mock Tauri clipboard plugin
 */
vi.mock('@tauri-apps/plugin-clipboard-manager', () => ({
    readText: vi.fn().mockResolvedValue(''),
    writeText: vi.fn().mockResolvedValue(undefined),
}));

/**
 * Mock Tauri opener plugin
 */
vi.mock('@tauri-apps/plugin-opener', () => ({
    revealItemInDir: vi.fn().mockResolvedValue(undefined),
    openUrl: vi.fn().mockResolvedValue(undefined),
}));

/**
 * Mock Tauri fs plugin
 */
vi.mock('@tauri-apps/plugin-fs', () => ({
    readFile: vi.fn().mockResolvedValue(new Uint8Array()),
    readTextFile: vi.fn().mockResolvedValue(''),
    writeFile: vi.fn().mockResolvedValue(undefined),
    writeTextFile: vi.fn().mockResolvedValue(undefined),
    exists: vi.fn().mockResolvedValue(false),
    readDir: vi.fn().mockResolvedValue([]),
    mkdir: vi.fn().mockResolvedValue(undefined),
    remove: vi.fn().mockResolvedValue(undefined),
    rename: vi.fn().mockResolvedValue(undefined),
    copyFile: vi.fn().mockResolvedValue(undefined),
    BaseDirectory: {
        AppConfig: 0,
        AppData: 1,
        AppLocalData: 2,
        Document: 3,
        Home: 4,
    },
}));

/**
 * Mock Tauri process plugin
 */
vi.mock('@tauri-apps/plugin-process', () => ({
    exit: vi.fn().mockResolvedValue(undefined),
    relaunch: vi.fn().mockResolvedValue(undefined),
}));

// =============================================================================
// Mock Native Module
// =============================================================================

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

// =============================================================================
// Mock Browser APIs
// =============================================================================

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
    })),
});

// Mock ResizeObserver
class MockResizeObserver {
    observe = vi.fn();
    unobserve = vi.fn();
    disconnect = vi.fn();
}
vi.stubGlobal('ResizeObserver', MockResizeObserver);

// Mock IntersectionObserver
class MockIntersectionObserver {
    observe = vi.fn();
    unobserve = vi.fn();
    disconnect = vi.fn();
}
vi.stubGlobal('IntersectionObserver', MockIntersectionObserver);

// Mock scrollTo
window.scrollTo = vi.fn();
Element.prototype.scrollTo = vi.fn();
Element.prototype.scrollIntoView = vi.fn();

// =============================================================================
// Test Utilities
// =============================================================================

/**
 * Wait for an element to appear in the DOM
 */
export async function waitForElement(
    container: HTMLElement,
    selector: string,
    timeout = 3000
): Promise<Element | null> {
    const start = Date.now();
    while (Date.now() - start < timeout) {
        const element = container.querySelector(selector);
        if (element) return element;
        await new Promise((resolve) => setTimeout(resolve, 50));
    }
    return null;
}

/**
 * Wait for a condition to be true
 */
export async function waitFor(
    condition: () => boolean | Promise<boolean>,
    timeout = 3000,
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
 * Create a mock file node
 */
export function createMockFileNode(
    name: string,
    path: string,
    isDir = false
): { name: string; path: string; isDir: boolean; children?: any[] } {
    return {
        name,
        path,
        isDir,
        children: isDir ? [] : undefined,
    };
}

/**
 * Create mock workspace files
 */
export function createMockWorkspaceFiles() {
    return [
        createMockFileNode('notes', '/workspace/notes', true),
        createMockFileNode('README.md', '/workspace/README.md'),
        createMockFileNode('todo.md', '/workspace/todo.md'),
    ];
}

/**
 * Simulate user typing in an input
 */
export async function typeInElement(element: HTMLElement, text: string): Promise<void> {
    element.focus();
    for (const char of text) {
        const event = new KeyboardEvent('keydown', { key: char, bubbles: true });
        element.dispatchEvent(event);
        if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) {
            element.value += char;
        }
        element.dispatchEvent(new Event('input', { bubbles: true }));
    }
}

/**
 * Get mock app configuration
 */
export function getMockAppConfig() {
    return {
        workspace: '/mock/workspace',
        expandedDirs: [],
        sidebarWidth: 250,
        sidebarCollapsed: false,
        viewMode: 'side-by-side',
        sortOrder: 'a-z',
    };
}

/**
 * Get mock editor configuration
 */
export function getMockEditorConfig() {
    return {
        fontSize: 16,
        fontFamily: 'monospace',
        lineHeight: 1.6,
        tabSize: 4,
        wordWrap: true,
        showLineNumbers: true,
        vimMode: false,
    };
}

// =============================================================================
// Test Lifecycle
// =============================================================================

beforeAll(() => {
    // Any global setup before all tests
});

beforeEach(() => {
    // Clear all mocks before each test
    vi.clearAllMocks();
});

afterEach(() => {
    // Cleanup React Testing Library
    cleanup();
});

afterAll(() => {
    // Any global cleanup after all tests
});
