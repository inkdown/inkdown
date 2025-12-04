/**
 * DialogManager - System file/folder dialog management
 *
 * Provides native file/folder selection dialogs using the system's file explorer.
 * Works with native platform backend for dialogs.
 */

import { native } from './native';

// ============================================================================
// Types
// ============================================================================

/**
 * File filter for dialog (e.g., show only PDF files)
 */
export interface FileFilter {
    /** Display name for the filter (e.g., "PDF Files") */
    name: string;
    /** File extensions without dot (e.g., ["pdf", "doc"]) */
    extensions: string[];
}

/**
 * Options for file dialogs
 */
export interface FileDialogOptions {
    /** Dialog window title */
    title?: string;
    /** Default directory to open */
    defaultPath?: string;
    /** File filters to show */
    filters?: FileFilter[];
    /** Default file name (for save dialog) */
    defaultName?: string;
}

/**
 * Options for folder dialogs
 */
export interface FolderDialogOptions {
    /** Dialog window title */
    title?: string;
    /** Default directory to open */
    defaultPath?: string;
}

// ============================================================================
// DialogManager Class
// ============================================================================

/**
 * Manager for native system dialogs
 */
export class DialogManager {
    /**
     * Show a save file dialog
     *
     * @param options - Dialog options
     * @returns The selected file path, or null if cancelled
     *
     * @example
     * ```ts
     * const path = await app.dialog.showSaveDialog({
     *   title: 'Save PDF',
     *   defaultName: 'document.pdf',
     *   filters: [{ name: 'PDF Files', extensions: ['pdf'] }]
     * });
     * if (path) {
     *   // Save file to path
     * }
     * ```
     */
    async showSaveDialog(options: FileDialogOptions = {}): Promise<string | null> {
        if (!native.supportsModule('dialog')) {
            console.warn('Dialog module not available');
            return null;
        }
        
        try {
            const result = await native.dialog!.showSaveDialog?.({
                title: options.title,
                defaultPath: options.defaultPath,
                defaultName: options.defaultName,
                filters: options.filters,
            });
            return result ?? null;
        } catch (error) {
            console.error('Failed to show save dialog:', error);
            throw error;
        }
    }

    /**
     * Show an open file dialog (single file selection)
     *
     * @param options - Dialog options
     * @returns The selected file path, or null if cancelled
     *
     * @example
     * ```ts
     * const path = await app.dialog.showOpenFileDialog({
     *   title: 'Select Image',
     *   filters: [{ name: 'Images', extensions: ['png', 'jpg', 'jpeg', 'gif'] }]
     * });
     * if (path) {
     *   // Use selected file
     * }
     * ```
     */
    async showOpenFileDialog(options: FileDialogOptions = {}): Promise<string | null> {
        if (!native.supportsModule('dialog')) {
            console.warn('Dialog module not available');
            return null;
        }
        
        try {
            const result = await native.dialog!.showOpenFileDialog?.({
                title: options.title,
                defaultPath: options.defaultPath,
                filters: options.filters,
            });
            return result ?? null;
        } catch (error) {
            console.error('Failed to show open file dialog:', error);
            throw error;
        }
    }

    /**
     * Show an open file dialog (multiple file selection)
     *
     * @param options - Dialog options
     * @returns Array of selected file paths (empty if cancelled)
     *
     * @example
     * ```ts
     * const paths = await app.dialog.showOpenFilesDialog({
     *   title: 'Select Files',
     *   filters: [{ name: 'Documents', extensions: ['md', 'txt'] }]
     * });
     * for (const path of paths) {
     *   // Process each file
     * }
     * ```
     */
    async showOpenFilesDialog(options: FileDialogOptions = {}): Promise<string[]> {
        if (!native.supportsModule('dialog')) {
            console.warn('Dialog module not available');
            return [];
        }
        
        try {
            const result = await native.dialog!.showOpenFilesDialog?.({
                title: options.title,
                defaultPath: options.defaultPath,
                filters: options.filters,
            });
            return result ?? [];
        } catch (error) {
            console.error('Failed to show open files dialog:', error);
            throw error;
        }
    }

    /**
     * Show a folder selection dialog
     *
     * @param options - Dialog options
     * @returns The selected folder path, or null if cancelled
     *
     * @example
     * ```ts
     * const folder = await app.dialog.showOpenFolderDialog({
     *   title: 'Select Export Folder'
     * });
     * if (folder) {
     *   // Export to folder
     * }
     * ```
     */
    async showOpenFolderDialog(options: FolderDialogOptions = {}): Promise<string | null> {
        if (!native.supportsModule('dialog')) {
            console.warn('Dialog module not available');
            return null;
        }
        
        try {
            const result = await native.dialog!.showOpenFolderDialog?.({
                title: options.title,
                defaultPath: options.defaultPath,
            });
            return result ?? null;
        } catch (error) {
            console.error('Failed to show open folder dialog:', error);
            throw error;
        }
    }
}
