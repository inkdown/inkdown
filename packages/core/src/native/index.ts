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

// Singleton
export { native, type NativeModules } from './NativeBridge';

// Interfaces
export type {
  IFileSystem,
  IConfig,
  IDialog,
  IClipboard,
  IPlatform,
  IWindowControls,
  IShell,
  IProcessControl,
  IExport,
  IFont,
  IMenu,
  MenuItem,
  NormalMenuItem,
  SeparatorMenuItem,
  CheckboxMenuItem,
  SubmenuMenuItem,
  ContextMenuOptions,
  MenuPosition,
} from './interfaces';

// Types
export type {
  FileNode,
  FileInfo,
  FileFilter,
  SaveDialogOptions,
  OpenDialogOptions,
  FolderDialogOptions,
  AlertOptions,
  ConfirmOptions,
  PromptOptions,
  PlatformType,
  OSType,
  PlatformInfo,
  ExportOptions,
  ExportResult,
  ImportOptions,
  ImportResult,
  ExportFeature,
  PlatformFeature,
} from './types';
