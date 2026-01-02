/**
 * Test utilities for creating and destroying test App instances
 */

import { App } from '@inkdown/core';
import { IDBFactory } from 'fake-indexeddb';

/**
 * Create a test App instance with mocked dependencies
 * 
 * @example
 * ```ts
 * let app: App;
 * 
 * beforeEach(async () => {
 *     app = await createTestApp();
 * });
 * 
 * afterEach(async () => {
 *     await destroyTestApp(app);
 * });
 * ```
 */
export async function createTestApp(): Promise<App> {
    // Reset IndexedDB for this test
    global.indexedDB = new IDBFactory();
    
    // Create app with no built-in plugins
    const app = new App([]);
    
    // Initialize the app
    await app.init();
    
    return app;
}

/**
 * Destroy a test App instance and clean up all resources
 * 
 * @param app - The App instance to destroy
 */
export async function destroyTestApp(app: App): Promise<void> {
    // Unload all plugins
    if (app.pluginManager) {
        const plugins = app.pluginManager.getLoadedPlugins();
        for (const plugin of plugins) {
            try {
                await app.pluginManager.unloadPlugin(plugin.manifest.id);
            } catch (error) {
                // Ignore errors during cleanup
            }
        }
    }
    
    // Clear tab manager
    if (app.tabManager) {
        const tabs = app.tabManager.getTabs();
        for (const tab of tabs) {
            try {
                await app.tabManager.closeTab(tab.id);
            } catch (error) {
                // Ignore errors during cleanup
            }
        }
    }
    
    // Close all IndexedDB connections
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
}

/**
 * Wait for IndexedDB operations to complete
 */
export async function flushIndexedDB(): Promise<void> {
    return new Promise((resolve) => {
        setTimeout(resolve, 100);
    });
}

/**
 * Clear all IndexedDB databases
 */
export async function clearAllIndexedDB(): Promise<void> {
    try {
        const dbs = await indexedDB.databases();
        for (const dbInfo of dbs) {
            if (dbInfo.name) {
                indexedDB.deleteDatabase(dbInfo.name);
            }
        }
        // Wait for delete operations to complete
        await flushIndexedDB();
    } catch (error) {
        // Ignore errors
    }
}
