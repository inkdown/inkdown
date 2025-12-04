import { native } from '../native';

export interface FileNode {
    name: string;
    path: string;
    isDirectory: boolean;
    children?: FileNode[];
    size?: number;
    modified?: number;
}

/**
 * FileSystemManager - Manages file system operations
 * Uses native abstraction layer for cross-platform support
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
            return await native.fs.readDirectory(path, recursive);
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
            return await native.fs.readFile(path);
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
            await native.fs.writeFile(path, content);

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
            // Convert base64 to Uint8Array
            const binary = atob(base64Content);
            const bytes = new Uint8Array(binary.length);
            for (let i = 0; i < binary.length; i++) {
                bytes[i] = binary.charCodeAt(i);
            }
            await native.fs.writeFileBinary(path, bytes);

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
            await native.fs.writeFile(path, '');
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
            await native.fs.createDirectory(path);

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
            await native.fs.rename(oldPath, newPath);
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
            await native.fs.delete(path);
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
            await native.fs.move(source, destination);
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
            return await native.fs.exists(path);
        } catch (error) {
            console.error('Failed to check path existence:', error);
            return false;
        }
    }

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
