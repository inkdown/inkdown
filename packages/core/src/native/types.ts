/**
 * Native Bridge Types
 * 
 * Shared types for native platform abstractions
 */

// ============================================================================
// File System Types
// ============================================================================

export interface FileNode {
  name: string;
  path: string;
  isDirectory: boolean;
  children?: FileNode[];
  size?: number;
  modified?: number;
}

export interface FileInfo {
  size: number;
  created: number;
  modified: number;
  isDirectory: boolean;
}

// ============================================================================
// Dialog Types
// ============================================================================

export interface FileFilter {
  name: string;
  extensions: string[];
}

export interface SaveDialogOptions {
  title?: string;
  defaultPath?: string;
  defaultName?: string;
  filters?: FileFilter[];
}

export interface OpenDialogOptions {
  title?: string;
  defaultPath?: string;
  filters?: FileFilter[];
}

export interface FolderDialogOptions {
  title?: string;
  defaultPath?: string;
}

export interface AlertOptions {
  title: string;
  message: string;
  type?: 'info' | 'warning' | 'error';
}

export interface ConfirmOptions {
  title: string;
  message: string;
  okLabel?: string;
  cancelLabel?: string;
}

export interface PromptOptions {
  title: string;
  message: string;
  defaultValue?: string;
}

// ============================================================================
// Platform Types
// ============================================================================

export type PlatformType = 'desktop' | 'mobile' | 'web';
export type OSType = 'windows' | 'macos' | 'linux' | 'ios' | 'android' | 'web';

export interface PlatformInfo {
  type: PlatformType;
  os: OSType;
  version: string;
}

// ============================================================================
// Export Types (Cross-Platform)
// ============================================================================

export interface ExportOptions {
  /** Suggested filename */
  filename: string;
  /** Data as string or Uint8Array */
  data: string | Uint8Array;
  /** MIME type of the file */
  mimeType: string;
  /** Title for dialog/share sheet */
  title?: string;
}

export interface ExportResult {
  /** Whether the operation was successful */
  success: boolean;
  /** File path (desktop only) */
  path?: string;
  /** Whether it was shared (mobile) */
  shared?: boolean;
}

export interface ImportOptions {
  /** Dialog title */
  title?: string;
  /** File extensions to filter */
  extensions?: string[];
  /** MIME types accepted (mobile) */
  mimeTypes?: string[];
}

export interface ImportResult {
  /** File name */
  name: string;
  /** Content as string or Uint8Array */
  data: string | Uint8Array;
  /** Detected MIME type */
  mimeType?: string;
  /** Original path (desktop only) */
  path?: string;
  /** Content provider URI (Android only) */
  uri?: string;
}

export type ExportFeature = 
  | 'saveToPath'
  | 'pickFolder'
  | 'share'
  | 'clipboard'
  | 'print';

export type PlatformFeature =
  | 'nativeDialog'
  | 'absolutePaths'
  | 'shareSheet'
  | 'systemFonts'
  | 'windowControls'
  | 'fileSystemAccess';
