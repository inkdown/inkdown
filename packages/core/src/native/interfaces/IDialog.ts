/**
 * IDialog Interface
 * 
 * Native dialogs - OPTIONAL (may not exist on mobile)
 */

import type {
  SaveDialogOptions,
  OpenDialogOptions,
  FolderDialogOptions,
  AlertOptions,
  ConfirmOptions,
  PromptOptions,
} from '../types';

export interface IDialog {
  // ============================================================================
  // File Selection (Desktop only - methods are optional)
  // ============================================================================
  
  /**
   * Show a save file dialog
   * @platform desktop
   * @returns Selected file path, or null if cancelled
   */
  showSaveDialog?(options?: SaveDialogOptions): Promise<string | null>;
  
  /**
   * Show an open file dialog (single file)
   * @platform desktop
   * @returns Selected file path, or null if cancelled
   */
  showOpenFileDialog?(options?: OpenDialogOptions): Promise<string | null>;
  
  /**
   * Show an open file dialog (multiple files)
   * @platform desktop
   * @returns Array of selected file paths
   */
  showOpenFilesDialog?(options?: OpenDialogOptions): Promise<string[]>;
  
  /**
   * Show a folder selection dialog
   * @platform desktop
   * @returns Selected folder path, or null if cancelled
   */
  showOpenFolderDialog?(options?: FolderDialogOptions): Promise<string | null>;
  
  // ============================================================================
  // Alerts (Available on all platforms)
  // ============================================================================
  
  /**
   * Show an alert dialog
   */
  alert(options: AlertOptions): Promise<void>;
  
  /**
   * Show a confirmation dialog
   * @returns true if confirmed, false otherwise
   */
  confirm(options: ConfirmOptions): Promise<boolean>;
  
  /**
   * Show a prompt dialog
   * @returns User input, or null if cancelled
   */
  prompt?(options: PromptOptions): Promise<string | null>;
}
