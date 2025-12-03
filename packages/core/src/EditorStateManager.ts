import type { App } from './App';

/**
 * EditorStateManager - Manages editor content state and persistence
 *
 * This class is responsible for:
 * - Caching file contents in memory for fast switching
 * - Saving dirty files to disk with auto-save
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

    // Auto-save debounce timers: filePath -> timer
    private autoSaveTimers: Map<string, NodeJS.Timeout> = new Map();
    
    // Auto-save delay in milliseconds (2 seconds after last change)
    private readonly AUTO_SAVE_DELAY_MS = 2000;

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
     * Triggers auto-save after a debounce period
     */
    updateContent(filePath: string, content: string): void {
        if (!filePath) return;

        this.contentCache.set(filePath, content);

        // Check if content actually changed from last saved
        const lastSaved = this.lastSavedContent.get(filePath);
        if (lastSaved !== content) {
            this.dirtyFiles.add(filePath);
            
            // Schedule auto-save with debounce
            this.scheduleAutoSave(filePath);
        } else {
            this.dirtyFiles.delete(filePath);
            // Cancel any pending auto-save since content is same as saved
            this.cancelAutoSave(filePath);
        }
    }

    /**
     * Schedule auto-save for a file with debounce
     */
    private scheduleAutoSave(filePath: string): void {
        // Cancel existing timer for this file
        this.cancelAutoSave(filePath);

        // Schedule new auto-save
        const timer = setTimeout(async () => {
            this.autoSaveTimers.delete(filePath);
            
            // Only save if still dirty
            if (this.dirtyFiles.has(filePath)) {
                try {
                    await this.saveFile(filePath);
                    console.log(`[EditorStateManager] Auto-saved: ${filePath}`);
                } catch (error) {
                    console.error(`[EditorStateManager] Auto-save failed for ${filePath}:`, error);
                }
            }
        }, this.AUTO_SAVE_DELAY_MS);

        this.autoSaveTimers.set(filePath, timer);
    }

    /**
     * Cancel pending auto-save for a file
     */
    private cancelAutoSave(filePath: string): void {
        const existingTimer = this.autoSaveTimers.get(filePath);
        if (existingTimer) {
            clearTimeout(existingTimer);
            this.autoSaveTimers.delete(filePath);
        }
    }

    /**
     * Cancel all pending auto-saves
     */
    cancelAllAutoSaves(): void {
        this.autoSaveTimers.forEach(timer => clearTimeout(timer));
        this.autoSaveTimers.clear();
    }

    /**
     * Save a file to disk
     */
    async saveFile(filePath: string): Promise<void> {
        if (!filePath) return;

        const content = this.contentCache.get(filePath);
        if (content === undefined) return;

        try {
            // Get the TFile object to use fileManager (which dispatches events)
            const file = this.app.workspace.getAbstractFileByPath(filePath);
            if (file && 'extension' in file) {
                // Use fileManager.modify to trigger file-modify event for sync
                await this.app.fileManager.modify(file as any, content);
            } else {
                // Fallback to direct write if file object not found
                await this.app.fileSystemManager.writeFile(filePath, content);
                // Manually trigger file-modify event
                this.app.workspace._onFileModify({ path: filePath } as any);
            }
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
            // Get the TFile object to use fileManager (which dispatches events)
            const file = this.app.workspace.getAbstractFileByPath(filePath);
            if (file && 'extension' in file) {
                // Use fileManager.modify to trigger file-modify event for sync
                await this.app.fileManager.modify(file as any, content);
            } else {
                // Fallback to direct write if file object not found
                await this.app.fileSystemManager.writeFile(filePath, content);
                // Manually trigger file-modify event
                this.app.workspace._onFileModify({ path: filePath } as any);
            }
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
