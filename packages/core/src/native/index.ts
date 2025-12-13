/**
 * @inkdown/core/native
 *
 * Platform abstraction layer for native operations.
 * Allows the same code to run on desktop (Tauri) and mobile (React Native).
 *
 * @example
 * ```ts
 * import { native } from '@inkdown/core/native';
 *
 * // Read a file
 * const content = await native.fs.readFile('/path/to/file');
 *
 * // Export a file (cross-platform)
 * await native.export.saveFile({
 *   filename: 'document.pdf',
 *   data: pdfData,
 *   mimeType: 'application/pdf',
 * });
 *
 * // Check platform support
 * if (native.supports('nativeDialog')) {
 *   // Desktop-specific code
 * }
 * ```
 */

// Interfaces
export type {
    CheckboxMenuItem,
    ContextMenuOptions,
    IClipboard,
    IConfig,
    IDialog,
    IExport,
    IFileSystem,
    IFont,
    IMenu,
    IPlatform,
    IProcessControl,
    IShell,
    IWindowControls,
    MenuItem,
    MenuPosition,
    NormalMenuItem,
    SeparatorMenuItem,
    SubmenuMenuItem,
} from './interfaces';
// Singleton
export { type NativeModules, native } from './NativeBridge';

// Types
export type {
    AlertOptions,
    ConfirmOptions,
    ExportFeature,
    ExportOptions,
    ExportResult,
    FileFilter,
    FileInfo,
    FileNode,
    FolderDialogOptions,
    ImportOptions,
    ImportResult,
    OpenDialogOptions,
    OSType,
    PlatformFeature,
    PlatformInfo,
    PlatformType,
    PromptOptions,
    SaveDialogOptions,
} from './types';
