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
import { TauriFileSystem } from './TauriFileSystem';
import { TauriConfig } from './TauriConfig';
import { TauriDialog } from './TauriDialog';
import { TauriClipboard } from './TauriClipboard';
import { TauriPlatform } from './TauriPlatform';
import { TauriExport } from './TauriExport';
import { TauriFont } from './TauriFont';
import { TauriMenu } from './TauriMenu';

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

// Export individual classes for advanced use cases
export { TauriFileSystem } from './TauriFileSystem';
export { TauriConfig } from './TauriConfig';
export { TauriDialog } from './TauriDialog';
export { TauriClipboard } from './TauriClipboard';
export { TauriPlatform } from './TauriPlatform';
export { TauriExport } from './TauriExport';
export { TauriFont } from './TauriFont';
export { TauriMenu } from './TauriMenu';
