import type { App } from './App';

/**
 * EditorStateManager - Manages editor content state and persistence
 *
 * This class is responsible for:
 * - Caching file contents in memory for fast switching
 * - Saving dirty files to disk
 * - Loading files from disk
 *
 * The cache is keyed by filePath (not tabId) because:
 * - Multiple tabs can reference the same file (we prevent this, but it's safer)
 * - When tabs are closed and reopened, filePath stays the same but tabId changes
 */
export class EditorStateManager {
    private app: App;

    // In-memory cache: filePath -> content
    private contentCache: Map<string, string> = new Map();

    // Track which files have unsaved changes: filePath -> true
    private dirtyFiles: Set<string> = new Set();

    // Track the last saved content to detect real changes: filePath -> content
    private lastSavedContent: Map<string, string> = new Map();

    constructor(app: App) {
        this.app = app;
    }

    /**
     * Get content for a file
     * First checks memory cache, then loads from disk
     */
    async getContent(filePath: string): Promise<string> {
        if (!filePath) return '';

        // Check memory cache first
        const cached = this.contentCache.get(filePath);
        if (cached !== undefined) {
            return cached;
        }

        // Load from disk
        try {
            const content = await this.app.fileSystemManager.readFile(filePath);
            this.contentCache.set(filePath, content);
            this.lastSavedContent.set(filePath, content);
            return content;
        } catch (error) {
            console.error(`Failed to load file ${filePath}:`, error);
            throw error;
        }
    }

    /**
     * Check if content is cached in memory
     */
    hasCache(filePath: string): boolean {
        return this.contentCache.has(filePath);
    }

    /**
     * Get cached content without loading from disk
     * Returns undefined if not in cache
     */
    getCachedContent(filePath: string): string | undefined {
        return this.contentCache.get(filePath);
    }

    /**
     * Update content in cache and mark as dirty
     */
    updateContent(filePath: string, content: string): void {
        if (!filePath) return;

        this.contentCache.set(filePath, content);

        // Check if content actually changed from last saved
        const lastSaved = this.lastSavedContent.get(filePath);
        if (lastSaved !== content) {
            this.dirtyFiles.add(filePath);
        } else {
            this.dirtyFiles.delete(filePath);
        }
    }

    /**
     * Save a file to disk
     */
    async saveFile(filePath: string): Promise<void> {
        if (!filePath) return;

        const content = this.contentCache.get(filePath);
        if (content === undefined) return;

        try {
            await this.app.fileSystemManager.writeFile(filePath, content);
            this.lastSavedContent.set(filePath, content);
            this.dirtyFiles.delete(filePath);
        } catch (error) {
            console.error(`Failed to save file ${filePath}:`, error);
            throw error;
        }
    }

    /**
     * Save a file with specific content
     */
    async saveFileWithContent(filePath: string, content: string): Promise<void> {
        if (!filePath) return;

        try {
            await this.app.fileSystemManager.writeFile(filePath, content);
            this.contentCache.set(filePath, content);
            this.lastSavedContent.set(filePath, content);
            this.dirtyFiles.delete(filePath);
        } catch (error) {
            console.error(`Failed to save file ${filePath}:`, error);
            throw error;
        }
    }

    /**
     * Check if a file has unsaved changes
     */
    isDirty(filePath: string): boolean {
        return this.dirtyFiles.has(filePath);
    }

    /**
     * Save all dirty files
     */
    async saveAllDirty(): Promise<void> {
        const promises = Array.from(this.dirtyFiles).map((filePath) => this.saveFile(filePath));
        await Promise.all(promises);
    }

    /**
     * Clear cache for a file
     */
    clearCache(filePath: string): void {
        this.contentCache.delete(filePath);
        this.dirtyFiles.delete(filePath);
        this.lastSavedContent.delete(filePath);
    }

    /**
     * Clear all caches
     */
    clearAllCaches(): void {
        this.contentCache.clear();
        this.dirtyFiles.clear();
        this.lastSavedContent.clear();
    }
}
