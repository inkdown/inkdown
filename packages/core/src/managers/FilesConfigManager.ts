/**
 * FilesConfigManager - Manages file location settings
 * 
 * Handles configuration for where new notes and attachments are created.
 * Uses files.json config with localStorage cache for performance.
 */

import type { App } from '../App';

/**
 * Files configuration interface
 */
export interface FilesConfig {
    /** Location type for new notes: 'root' or 'folder' */
    newNotesLocation: 'root' | 'folder';
    /** Custom folder path for new notes (relative to workspace) */
    newNotesFolder: string;
    /** Location type for new attachments: 'root' or 'folder' */
    newAttachmentsLocation: 'root' | 'folder';
    /** Custom folder path for new attachments (relative to workspace) */
    newAttachmentsFolder: string;
}

/**
 * Default files configuration
 */
export const DEFAULT_FILES_CONFIG: FilesConfig = {
    newNotesLocation: 'root',
    newNotesFolder: '',
    newAttachmentsLocation: 'root',
    newAttachmentsFolder: '',
};

/**
 * Manages file location settings for notes and attachments
 */
export class FilesConfigManager {
    private config: FilesConfig = DEFAULT_FILES_CONFIG;
    private configLoaded = false;

    constructor(private app: App) {}

    /**
     * Load configuration from files.json
     */
    async loadConfig(): Promise<FilesConfig> {
        if (this.configLoaded) {
            return this.config;
        }

        try {
            const config = await this.app.configManager.loadConfig<FilesConfig>('files');
            if (config) {
                this.config = { ...DEFAULT_FILES_CONFIG, ...config };
            }
            this.configLoaded = true;
        } catch (error) {
            console.error('Failed to load files config:', error);
        }

        return this.config;
    }

    /**
     * Get current configuration (loads if not already loaded)
     */
    async getConfig(): Promise<FilesConfig> {
        if (!this.configLoaded) {
            await this.loadConfig();
        }
        return this.config;
    }

    /**
     * Update configuration
     */
    async saveConfig(config: Partial<FilesConfig>): Promise<void> {
        this.config = { ...this.config, ...config };
        await this.app.configManager.saveConfig('files', this.config);
    }

    /**
     * Get the full path for a new note
     * @param filename - The filename for the new note (without path)
     * @returns Full path where the note should be created
     */
    async getNewNotePath(filename: string): Promise<string> {
        await this.loadConfig();
        
        const workspacePath = this.app.fileSystemManager.getWorkspacePath();
        if (!workspacePath) {
            throw new Error('No workspace opened');
        }

        // Ensure filename has .md extension
        const noteFilename = filename.endsWith('.md') ? filename : `${filename}.md`;

        if (this.config.newNotesLocation === 'folder' && this.config.newNotesFolder) {
            const folderPath = this.app.fileSystemManager.joinPath(
                workspacePath,
                this.config.newNotesFolder
            );
            
            // Ensure folder exists
            await this.ensureDirectoryExists(folderPath);
            
            return this.app.fileSystemManager.joinPath(folderPath, noteFilename);
        }

        // Default: workspace root
        return this.app.fileSystemManager.joinPath(workspacePath, noteFilename);
    }

    /**
     * Get the full path for a new attachment
     * @param filename - The filename for the attachment
     * @returns Full path where the attachment should be saved
     */
    async getNewAttachmentPath(filename: string): Promise<string> {
        await this.loadConfig();
        
        const workspacePath = this.app.fileSystemManager.getWorkspacePath();
        if (!workspacePath) {
            throw new Error('No workspace opened');
        }

        if (this.config.newAttachmentsLocation === 'folder' && this.config.newAttachmentsFolder) {
            const folderPath = this.app.fileSystemManager.joinPath(
                workspacePath,
                this.config.newAttachmentsFolder
            );
            
            // Ensure folder exists
            await this.ensureDirectoryExists(folderPath);
            
            return this.app.fileSystemManager.joinPath(folderPath, filename);
        }

        // Default: workspace root
        return this.app.fileSystemManager.joinPath(workspacePath, filename);
    }

    /**
     * Get the relative path from workspace for an attachment
     * Useful for generating markdown links
     * @param filename - The filename for the attachment
     * @returns Relative path from workspace root
     */
    async getAttachmentRelativePath(filename: string): Promise<string> {
        await this.loadConfig();

        if (this.config.newAttachmentsLocation === 'folder' && this.config.newAttachmentsFolder) {
            return `${this.config.newAttachmentsFolder}/${filename}`;
        }

        return filename;
    }

    /**
     * Create a new note with a unique name
     * Uses the configured default location and generates "Untitled", "Untitled 1", etc.
     * @returns The full path of the created note
     */
    async createNewNote(): Promise<string> {
        await this.loadConfig();

        const workspacePath = this.app.fileSystemManager.getWorkspacePath();
        if (!workspacePath) {
            throw new Error('No workspace opened');
        }

        // Determine target directory
        let targetDir = workspacePath;
        if (this.config.newNotesLocation === 'folder' && this.config.newNotesFolder) {
            targetDir = this.app.fileSystemManager.joinPath(
                workspacePath,
                this.config.newNotesFolder
            );
            await this.ensureDirectoryExists(targetDir);
        }

        // Generate unique filename
        const baseName = 'Untitled';
        let filename = `${baseName}.md`;
        let counter = 1;

        // Check for existing files and find unique name
        while (await this.app.fileSystemManager.exists(
            this.app.fileSystemManager.joinPath(targetDir, filename)
        )) {
            filename = `${baseName} ${counter}.md`;
            counter++;
        }

        const fullPath = this.app.fileSystemManager.joinPath(targetDir, filename);

        // Create the file with empty content
        await this.app.fileSystemManager.writeFile(fullPath, '');

        return fullPath;
    }

    /**
     * Ensure a directory exists, creating it if necessary
     */
    private async ensureDirectoryExists(path: string): Promise<void> {
        try {
            const exists = await this.app.fileSystemManager.exists(path);
            if (!exists) {
                await this.app.fileSystemManager.createDirectory(path);
            }
        } catch (error) {
            console.warn('Failed to ensure directory exists:', error);
        }
    }
}
