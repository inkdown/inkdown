/**
 * @inkdown/native-tauri
 *
 * Tauri implementation of native platform abstractions.
 *
 * @example
 * ```ts
 * import { registerTauriAdapters } from '@inkdown/native-tauri';
 *
 * // Register all adapters at app boot
 * registerTauriAdapters();
 * ```
 */

import { native } from '@inkdown/core/native';
import { TauriClipboard } from './TauriClipboard';
import { TauriConfig } from './TauriConfig';
import { TauriDialog } from './TauriDialog';
import { TauriExport } from './TauriExport';
import { TauriFileSystem } from './TauriFileSystem';
import { TauriFont } from './TauriFont';
import { TauriMenu } from './TauriMenu';
import { TauriPlatform } from './TauriPlatform';

/**
 * Register all Tauri native adapters
 */
export function registerTauriAdapters(): void {
    native.registerAll({
        fs: new TauriFileSystem(),
        config: new TauriConfig(),
        platform: new TauriPlatform(),
        export: new TauriExport(),
        dialog: new TauriDialog(),
        clipboard: new TauriClipboard(),
        font: new TauriFont(),
        menu: new TauriMenu(),
    });
}

export { TauriAsset } from './TauriAsset';
export { TauriClipboard } from './TauriClipboard';
export { TauriConfig } from './TauriConfig';
export { TauriDialog } from './TauriDialog';
export { TauriExport } from './TauriExport';
// Export individual classes for advanced use cases
export { TauriFileSystem } from './TauriFileSystem';
export { TauriFont } from './TauriFont';
export { TauriMenu } from './TauriMenu';
export { TauriPlatform } from './TauriPlatform';
