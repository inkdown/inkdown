import { invoke } from '@tauri-apps/api/core';

export interface FileNode {
    name: string;
    path: string;
    isDirectory: boolean;
    children?: FileNode[];
    size?: number;
    modified?: number;
}

/**
 * FileSystemManager - Manages file system operations via Tauri
 * Cross-platform safe file operations
 */
export class FileSystemManager {
    private watchers: Map<string, () => void> = new Map();
    private _app: any = null; // Will be set by App

    /**
     * Set App reference (called by App during initialization)
     * @internal
     */
    setApp(app: any): void {
        this._app = app;
    }

    /**
     * Read directory structure
     */
    async readDirectory(path: string, recursive = false): Promise<FileNode[]> {
        try {
            const nodes = await invoke<any[]>('read_directory', { path, recursive });
            return nodes.map(this.convertFileNode);
        } catch (error) {
            console.error('Failed to read directory:', error);
            throw error;
        }
    }

    /**
     * Read file content
     */
    async readFile(path: string): Promise<string> {
        try {
            return await invoke<string>('read_file', { path });
        } catch (error) {
            console.error('Failed to read file:', error);
            throw error;
        }
    }

    /**
     * Write file content
     */
    async writeFile(path: string, content: string): Promise<void> {
        try {
            await invoke('write_file', { path, content });

            // Emit file:created event through workspace
            if (this._app?.workspace) {
                this._app.workspace.trigger('file:created', path);
            }
        } catch (error) {
            console.error('Failed to write file:', error);
            throw error;
        }
    }

    /**
     * Write binary file content (base64 encoded)
     * Used for saving images and other binary files
     */
    async writeFileBinary(path: string, base64Content: string): Promise<void> {
        try {
            await invoke('write_file_binary', { path, data: base64Content });

            // Emit file:created event through workspace
            if (this._app?.workspace) {
                this._app.workspace.trigger('file:created', path);
            }
        } catch (error) {
            console.error('Failed to write binary file:', error);
            throw error;
        }
    }

    /**
     * Create a new file
     */
    async createFile(path: string): Promise<void> {
        try {
            await invoke('create_file', { path });
        } catch (error) {
            console.error('Failed to create file:', error);
            throw error;
        }
    }

    /**
     * Create a new directory
     */
    async createDirectory(path: string): Promise<void> {
        try {
            await invoke('create_directory', { path });

            // Emit directory:created event through workspace
            if (this._app?.workspace) {
                this._app.workspace.trigger('directory:created', path);
            }
        } catch (error) {
            console.error('Failed to create directory:', error);
            throw error;
        }
    }

    /**
     * Rename a file or directory
     */
    async rename(oldPath: string, newPath: string): Promise<void> {
        try {
            await invoke('rename_path', { oldPath, newPath });
        } catch (error) {
            console.error('Failed to rename:', error);
            throw error;
        }
    }

    /**
     * Delete a file or directory
     */
    async delete(path: string): Promise<void> {
        try {
            await invoke('delete_path', { path });
        } catch (error) {
            console.error('Failed to delete:', error);
            throw error;
        }
    }

    /**
     * Move a file or directory
     */
    async move(source: string, destination: string): Promise<void> {
        try {
            await invoke('move_path', { source, destination });
        } catch (error) {
            console.error('Failed to move:', error);
            throw error;
        }
    }

    /**
     * Check if path exists
     */
    async exists(path: string): Promise<boolean> {
        try {
            return await invoke<boolean>('path_exists', { path });
        } catch (error) {
            console.error('Failed to check path existence:', error);
            return false;
        }
    }

    /**
     * Convert backend FileNode to frontend format
     */
    private convertFileNode = (node: any): FileNode => {
        return {
            name: node.name,
            path: node.path,
            isDirectory: node.is_directory,
            children: node.children?.map(this.convertFileNode),
            size: node.size,
            modified: node.modified,
        };
    };

    /**
     * Watch a directory for changes (placeholder for future implementation)
     */
    watchDirectory(path: string, callback: () => void): () => void {
        this.watchers.set(path, callback);

        // Return unwatch function
        return () => {
            this.watchers.delete(path);
        };
    }

    /**
     * Get file extension
     */
    getExtension(path: string): string {
        const parts = path.split('.');
        return parts.length > 1 ? parts[parts.length - 1] : '';
    }

    /**
     * Get file name without extension
     */
    getBaseName(path: string): string {
        const parts = path.split('/');
        return parts[parts.length - 1] || '';
    }

    /**
     * Get file name without extension (name only)
     */
    getFileNameWithoutExtension(path: string): string {
        const fileName = this.getBaseName(path);
        const dotIndex = fileName.lastIndexOf('.');
        return dotIndex > 0 ? fileName.substring(0, dotIndex) : fileName;
    }

    /**
     * Join paths safely (cross-platform)
     */
    joinPath(...parts: string[]): string {
        return parts.join('/').replace(/\/+/g, '/');
    }

    /**
     * Get parent directory
     */
    getParentPath(path: string): string {
        const parts = path.split('/').filter((p) => p);
        parts.pop();
        return '/' + parts.join('/');
    }

    /**
     * Get the current workspace path
     * This is set when a workspace is opened
     */
    private workspacePath: string | null = null;

    setWorkspacePath(path: string): void {
        this.workspacePath = path;
    }

    getWorkspacePath(): string | null {
        return this.workspacePath;
    }
}
