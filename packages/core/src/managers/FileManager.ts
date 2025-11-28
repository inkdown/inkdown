import type { App } from '../App';
import type { FileSystemManager } from '../filesystem/FileSystemManager';
import { parseFrontMatter } from '../utils/frontmatter';
import type { TAbstractFile, TFile, TFolder, Workspace } from './Workspace';

/**
 * Options for writing data
 */
export interface DataWriteOptions {
    /** Current modification time (for conflict detection) */
    mtime?: number;
    /** Current creation time */
    ctime?: number;
}

/**
 * FileManager - High-level file operations with event dispatching
 *
 * This wraps FileSystemManager and adds:
 * - Event dispatching (file-create, modify, delete, rename)
 * - Path utilities
 * - Frontmatter processing
 */
export class FileManager {
    private _app: App;
    private fileSystemManager: FileSystemManager;
    private workspace: Workspace;

    constructor(app: App) {
        this._app = app;
        this.fileSystemManager = app.fileSystemManager;
        this.workspace = app.workspace;
    }

    /**
     * Create a new file with content
     */
    async createFile(path: string, content = ''): Promise<TFile> {
        // Create the file
        await this.fileSystemManager.createFile(path);

        // Write content if provided
        if (content) {
            await this.fileSystemManager.writeFile(path, content);
        }

        // Create TFile object
        const file = await this.getFileByPath(path);

        // Trigger event
        this.workspace._onFileCreate(file);

        return file;
    }

    /**
     * Read file content
     */
    async read(file: TFile): Promise<string> {
        return await this.fileSystemManager.readFile(file.path);
    }

    /**
     * Write file content
     */
    async modify(file: TFile, content: string, _options?: DataWriteOptions): Promise<void> {
        await this.fileSystemManager.writeFile(file.path, content);

        // Update stats
        file.stat.mtime = Date.now();

        // Trigger event
        this.workspace._onFileModify(file);
    }

    /**
     * Rename or move a file
     */
    async renameFile(file: TAbstractFile, newPath: string): Promise<void> {
        const oldPath = file.path;

        await this.fileSystemManager.rename(oldPath, newPath);

        // Update file object
        file.path = newPath;
        file.name = this.fileSystemManager.getBaseName(newPath);

        if ('basename' in file) {
            // It's a TFile
            file.basename = this.fileSystemManager.getFileNameWithoutExtension(newPath);
            file.extension = this.fileSystemManager.getExtension(newPath);

            // Trigger event
            this.workspace._onFileRename(file as TFile, oldPath);
        }
    }

    /**
     * Delete a file (move to trash if possible)
     */
    async trashFile(file: TAbstractFile): Promise<void> {
        await this.fileSystemManager.delete(file.path);

        // Trigger event
        this.workspace._onFileDelete(file);
    }

    /**
     * Copy a file to a new location
     */
    async copyFile(file: TFile, newPath: string): Promise<TFile> {
        const content = await this.read(file);
        return await this.createFile(newPath, content);
    }

    /**
     * Process frontmatter atomically
     * Reads file, modifies frontmatter, writes back
     */
    async processFrontMatter(
        file: TFile,
        fn: (frontmatter: Record<string, any>) => void,
        options?: DataWriteOptions,
    ): Promise<void> {
        const content = await this.read(file);
        const { frontmatter, body } = parseFrontMatter(content);

        // Modify frontmatter
        fn(frontmatter);

        // Reconstruct content
        const newContent = this.stringifyFrontMatter(frontmatter, body);

        // Write back
        await this.modify(file, newContent, options);
    }

    /**
     * Generate markdown link
     */
    generateMarkdownLink(
        file: TFile,
        _sourcePath: string,
        subpath?: string,
        alias?: string,
    ): string {
        // Simple implementation - can be improved with relative paths
        const linkPath = file.path;
        const display = alias || file.basename;

        if (subpath) {
            return `[[${linkPath}#${subpath}|${display}]]`;
        }

        return `[[${linkPath}|${display}]]`;
    }

    /**
     * Get folder for new files based on preferences
     * Returns the workspace root folder as the parent
     * @param _sourcePath Source path (unused for now)
     * @param _newFilePath New file path (unused for now)
     * @returns Root folder
     */
    getNewFileParent(_sourcePath: string, _newFilePath?: string): TFolder {
        const workspacePath = this.fileSystemManager.getWorkspacePath();

        if (!workspacePath) {
            // Fallback to virtual root if no workspace set
            return {
                path: '/',
                name: 'root',
                children: [],
            };
        }

        // Return workspace root folder
        return {
            path: workspacePath,
            name: this.fileSystemManager.getBaseName(workspacePath),
            children: [],
        };
    }

    /**
     * Get file by path
     */
    private async getFileByPath(path: string): Promise<TFile> {
        const exists = await this.fileSystemManager.exists(path);
        if (!exists) {
            throw new Error(`File not found: ${path}`);
        }

        const name = this.fileSystemManager.getBaseName(path);
        const basename = this.fileSystemManager.getFileNameWithoutExtension(path);
        const extension = this.fileSystemManager.getExtension(path);

        // Get parent directory to read file metadata
        const parentPath = this.fileSystemManager.getParentPath(path);
        let size = 0;
        let mtime = Date.now();
        let ctime = Date.now();

        try {
            // Read parent directory to get file metadata
            const entries = await this.fileSystemManager.readDirectory(parentPath);
            const fileEntry = entries.find((e) => e.path === path || e.name === name);

            if (fileEntry) {
                size = fileEntry.size || 0;
                mtime = fileEntry.modified || Date.now();
                ctime = fileEntry.modified || Date.now();
            }
        } catch (error) {
            console.warn('Could not read file metadata:', error);
        }

        return {
            path,
            name,
            basename,
            extension,
            stat: {
                size,
                mtime,
                ctime,
            },
        };
    }

    /**
     * Stringify frontmatter + body
     */
    private stringifyFrontMatter(frontmatter: Record<string, any>, body: string): string {
        if (Object.keys(frontmatter).length === 0) {
            return body;
        }

        const yaml = Object.entries(frontmatter)
            .map(([key, value]) => {
                if (typeof value === 'string') {
                    return `${key}: "${value}"`;
                }
                if (Array.isArray(value)) {
                    return `${key}:\n${value.map((v) => `  - ${v}`).join('\n')}`;
                }
                return `${key}: ${value}`;
            })
            .join('\n');

        return `---\n${yaml}\n---\n\n${body}`;
    }
}
