import type { App } from '../App';
import { type EventRef, Events } from '../Events';
import type { FileSystemManager } from '../filesystem/FileSystemManager';

/**
 * File types
 */
export interface TFile {
    path: string;
    name: string;
    basename: string;
    extension: string;
    stat: {
        size: number;
        mtime: number;
        ctime: number;
    };
}

export interface TFolder {
    path: string;
    name: string;
    children: TAbstractFile[];
}

export type TAbstractFile = TFile | TFolder;

import { Editor, EditorAdapter } from '../editor/EditorAdapter';

/**
 * Workspace - Manages file operations and file events
 *
 * @example
 * ```ts
 * // Get all markdown files
 * const files = await app.workspace.getMarkdownFiles();
 *
 * // Listen to file changes
 * app.workspace.onFileModify((file) => {
 *   console.log('File modified:', file.path);
 * });
 *
 * // Get a file by path
 * const file = app.workspace.getAbstractFileByPath('notes/example.md');
 * ```
 */
export class Workspace extends Events {
    private _app: App;
    private _fileSystemManager: FileSystemManager;
    private _fileCache: Map<string, TAbstractFile> = new Map();
    private _recentFiles: string[] = [];
    private readonly MAX_RECENT_FILES = 10;

    constructor(app: App) {
        super();
        this._app = app;
        this._fileSystemManager = app.fileSystemManager;
        // Load recent files from config
        this.loadRecentFiles();
    }

    /**
     * Get recently opened files
     * @returns Array of file paths, most recent first (max 10)
     */
    getRecentFiles(): string[] {
        return [...this._recentFiles];
    }

    /**
     * Add a file to recent files list
     * Called internally when files are opened
     * @internal
     */
    addRecentFile(filePath: string): void {
        // Remove if already exists
        this._recentFiles = this._recentFiles.filter(p => p !== filePath);

        // Add to front
        this._recentFiles.unshift(filePath);

        // Keep max 10
        this._recentFiles = this._recentFiles.slice(0, this.MAX_RECENT_FILES);

        // Save to config
        this.saveRecentFiles();

        // Emit event
        this.trigger('recent-files:changed', this._recentFiles);
    }

    /**
     * Load recent files from config
     * @private
     */
    private async loadRecentFiles(): Promise<void> {
        try {
            const config = await this._app.configManager.loadConfig<{
                recentFiles?: string[];
            }>('app');

            this._recentFiles = config?.recentFiles || [];
        } catch (error) {
            console.error('Failed to load recent files:', error);
            this._recentFiles = [];
        }
    }

    /**
     * Save recent files to config
     * @private
     */
    private async saveRecentFiles(): Promise<void> {
        try {
            const config: any = await this._app.configManager.loadConfig('app') || {};
            config.recentFiles = this._recentFiles;
            await this._app.configManager.saveConfig('app', config);
        } catch (error) {
            console.error('Failed to save recent files:', error);
        }
    }

    /**
     * Refresh the file tree cache
     * Should be called when workspace changes or files are modified
     */
    async refreshFileTree(): Promise<void> {
        this._fileCache.clear();
        await this.getAllFiles();
    }

    /**
     * Get the workspace root path
     * @returns Workspace root path or null if no workspace is open
     */
    getRoot(): string | null {
        return this._fileSystemManager.getWorkspacePath();
    }

    /**
     * Get all files in the workspace (markdown and other files)
     * @returns Array of all files
     */
    async getAllFiles(): Promise<TFile[]> {
        const workspacePath = this._fileSystemManager.getWorkspacePath();

        console.log(workspacePath);
        if (!workspacePath) {
            return [];
        }

        const files: TFile[] = [];
        await this._collectFiles(workspacePath, files);
        return files;
    }

    /**
     * Get all markdown files in the workspace
     * @returns Array of markdown files (.md extension)
     */
    async getMarkdownFiles(): Promise<TFile[]> {
        const allFiles = await this.getAllFiles();
        return allFiles.filter((file) => file.extension === 'md');
    }

    /**
     * Get all files with specific extensions
     * @param extensions Array of extensions (without dot)
     */
    async getFiles(extensions: string[]): Promise<TFile[]> {
        const allFiles = await this.getAllFiles();
        return allFiles.filter((file) => extensions.includes(file.extension));
    }

    /**
     * Get the active editor instance
     * Returns an Editor adapter that provides a safe API for plugins
     */
    get activeEditor(): Editor | null {
        const view = this._app.editorRegistry.getActive();
        if (!view) return null;
        return new EditorAdapter(view);
    }

    /**
     * Get all files matching a pattern
     * @param pattern Glob pattern or regex
     */
    async getFilesMatching(pattern: string | RegExp): Promise<TFile[]> {
        const allFiles = await this.getAllFiles();

        if (typeof pattern === 'string') {
            // Simple glob: *.md, notes/*.md, etc.
            // Escape dots, replace * with .*
            const regex = new RegExp(
                '^' + pattern
                    .replace(/\./g, '\\.')
                    .replace(/\*/g, '.*') + '$'
            );
            return allFiles.filter(f => regex.test(f.path));
        }

        return allFiles.filter(f => pattern.test(f.path));
    }

    /**
     * Get relative path from workspace root
     * @param absolutePath Absolute path
     * @returns Relative path or null if not in workspace
     */
    getRelativePath(absolutePath: string): string | null {
        const root = this.getRoot();
        if (!root || !absolutePath.startsWith(root)) {
            return null;
        }

        // Handle case where path IS the root
        if (absolutePath === root) return '';

        // Remove root + slash
        return absolutePath.substring(root.length + 1);
    }

    /**
     * Get absolute path from workspace-relative path
     * @param relativePath Path relative to workspace root
     * @returns Absolute path or null if no workspace
     */
    getAbsolutePath(relativePath: string): string | null {
        const root = this.getRoot();
        if (!root) return null;

        return `${root}/${relativePath}`;
    }

    /**
     * Get a file or folder by path
     * @param path Path to the file/folder (relative to workspace root)
     * @returns The file/folder or null if not found
     */
    getAbstractFileByPath(path: string): TAbstractFile | null {
        // Check cache first
        if (this._fileCache.has(path)) {
            return this._fileCache.get(path)!;
        }

        // If not in cache, try to load it
        // This is a synchronous method, so we can't await
        // In a real implementation, this would be pre-cached
        return null;
    }

    /**
     * Get active file (delegates to WorkspaceUI)
     * @deprecated Use app.workspaceUI.getActiveFile() instead
     */
    getActiveFile(): TFile | null {
        return this._app.workspaceUI?.getActiveFile() || null;
    }

    /**
     * Open a file (delegates to WorkspaceUI)
     * @deprecated Use app.workspaceUI.openFile() instead
     */
    async openFile(file: TFile | string): Promise<void> {
        if (typeof file === 'string') {
            const fileObj = this.getAbstractFileByPath(file) as TFile;
            if (!fileObj) {
                console.warn('File not found:', file);
                return;
            }
            file = fileObj;
        }

        await this._app.workspaceUI?.openFile(file);
    }

    /**
     * Read file content
     * @param file The file to read
     * @returns File content as string
     */
    async read(file: TFile): Promise<string> {
        return await this._app.fileManager.read(file);
    }

    /**
     * Modify file content
     * @param file The file to modify
     * @param content New content
     */
    async modify(file: TFile, content: string): Promise<void> {
        await this._app.fileManager.modify(file, content);
    }

    /**
     * Create a new file
     * @param path Path for the new file
     * @param content Initial content (optional)
     * @returns The created file
     */
    async create(path: string, content = ''): Promise<TFile> {
        const file = await this._app.fileManager.createFile(path, content);
        this._fileCache.set(path, file);
        return file;
    }

    /**
     * Delete a file (move to trash)
     * @param file The file to delete
     */
    async delete(file: TAbstractFile): Promise<void> {
        await this._app.fileManager.trashFile(file);
        this._fileCache.delete(file.path);
    }

    /**
     * Rename a file
     * @param file The file to rename
     * @param newPath New path for the file
     */
    async rename(file: TAbstractFile, newPath: string): Promise<void> {
        const oldPath = file.path;
        await this._app.fileManager.renameFile(file, newPath);

        // Update cache
        this._fileCache.delete(oldPath);
        this._fileCache.set(newPath, file);
    }

    /**
     * Copy a file
     * @param file The file to copy
     * @param newPath Destination path
     * @returns The new file
     */
    async copy(file: TFile, newPath: string): Promise<TFile> {
        const newFile = await this._app.fileManager.copyFile(file, newPath);
        this._fileCache.set(newPath, newFile);
        return newFile;
    }

    /**
     * Get the adapter (FileSystemManager)
     * For advanced file operations
     */
    getAdapter(): FileSystemManager {
        return this._fileSystemManager;
    }

    /**
     * Recursively collect files from a directory
     * @private
     */
    private async _collectFiles(dirPath: string, files: TFile[]): Promise<void> {
        try {
            const entries = await this._fileSystemManager.readDirectory(dirPath);

            for (const entry of entries) {
                const fullPath = `${dirPath}/${entry.name}`;

                if (entry.isDirectory) {
                    // Recursively collect files from subdirectory
                    await this._collectFiles(fullPath, files);
                } else {
                    // Create TFile object
                    const file: TFile = {
                        path: fullPath,
                        name: entry.name,
                        basename: this._fileSystemManager.getFileNameWithoutExtension(entry.name),
                        extension: this._fileSystemManager.getExtension(entry.name),
                        stat: {
                            size: entry.size || 0,
                            mtime: entry.modified || Date.now(),
                            ctime: entry.modified || Date.now(),
                        },
                    };

                    files.push(file);
                    this._fileCache.set(fullPath, file);
                }
            }
        } catch (error) {
            console.error('Error collecting files from', dirPath, error);
        }
    }

    // File event handlers (to be called by FileManager)

    /**
     * Trigger file-create event
     * @internal
     */
    _onFileCreate(file: TFile): void {
        this._fileCache.set(file.path, file);
        this.trigger('file-create', file);
    }

    /**
     * Trigger file-modify event
     * @internal
     */
    _onFileModify(file: TFile): void {
        this.trigger('file-modify', file);
    }

    /**
     * Trigger file-delete event
     * @internal
     */
    _onFileDelete(file: TAbstractFile): void {
        this._fileCache.delete(file.path);
        this.trigger('file-delete', file);
    }

    /**
     * Trigger file-rename event
     * @internal
     */
    _onFileRename(file: TFile, oldPath: string): void {
        this._fileCache.delete(oldPath);
        this._fileCache.set(file.path, file);
        this.trigger('file-rename', file, oldPath);
    }

    // Type-safe event registration

    /**
     * Register file-create event
     */
    onFileCreate(callback: (file: TFile) => void): EventRef {
        return this.on('file-create', callback);
    }

    /**
     * Register file-modify event
     */
    onFileModify(callback: (file: TFile) => void): EventRef {
        return this.on('file-modify', callback);
    }

    /**
     * Register file-delete event
     */
    onFileDelete(callback: (file: TAbstractFile) => void): EventRef {
        return this.on('file-delete', callback);
    }

    /**
     * Register file-rename event
     */
    onFileRename(callback: (file: TFile, oldPath: string) => void): EventRef {
        return this.on('file-rename', callback);
    }

    /**
     * Trigger a sync conflict event (called by ConflictResolver)
     */
    triggerSyncConflict(path: string, resolution: string, timestamp?: Date): void {
        this.trigger('sync-conflict', {
            path,
            resolution,
            timestamp: timestamp || new Date()
        });
    }

    /**
     * Trigger sync unlock required event (called by SyncManager)
     */
    triggerSyncUnlockRequired(): void {
        this.trigger('sync-unlock-required');
    }
}
