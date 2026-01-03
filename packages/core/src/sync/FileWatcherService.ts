import type { App } from '../App';
import { Events } from '../Events';
import type { TAbstractFile, TFile } from '../managers/Workspace';
import type { SelectiveSyncManager } from './SelectiveSyncManager';
import type { FileChangeEvent } from './types';

/**
 * Configuration for FileWatcherService
 */
export interface FileWatcherConfig {
    debounceMs?: number; // Debounce delay (default: 3000ms)
    batchWindowMs?: number; // Batch window for grouping changes (default: 500ms)
    maxRetries?: number; // Max retries for file reads (default: 3)
    retryDelayMs?: number; // Base delay for retry backoff (default: 100ms)
}

/**
 * Batched file changes for efficient processing
 */
export interface FileChangeBatch {
    changes: FileChangeEvent[];
    timestamp: Date;
}

/**
 * FileWatcherService - Watches for file changes with intelligent batching
 *
 * Features:
 * - Configurable debounce delay (default: 3s for user comfort)
 * - Batch processing of multiple changes
 * - Retry logic for transient read failures
 * - Pause/resume for programmatic file operations
 *
 * Events:
 * - 'change': Single file change (for immediate needs)
 * - 'changes-batch': Batched changes (for efficient sync)
 */
export class FileWatcherService extends Events {
    private app: App;
    private selectiveSync: SelectiveSyncManager;
    private debounceTimers: Map<string, NodeJS.Timeout> = new Map();
    private pendingChanges: Map<string, FileChangeEvent> = new Map();
    private batchTimer: NodeJS.Timeout | null = null;
    private isActive = false;
    private isPaused = false;

    // Configuration
    private config: Required<FileWatcherConfig> = {
        debounceMs: 3000, // 3 seconds debounce
        batchWindowMs: 500, // 500ms batch window
        maxRetries: 3,
        retryDelayMs: 100,
    };

    // Store bound handlers so we can properly remove them
    private boundHandleFileCreate: (file: TFile) => void;
    private boundHandleFileModify: (file: TFile) => void;
    private boundHandleFileDelete: (file: TAbstractFile) => void;
    private boundHandleFileRename: (file: TFile, oldPath: string) => void;

    constructor(app: App, selectiveSync: SelectiveSyncManager, config?: FileWatcherConfig) {
        super();
        this.app = app;
        this.selectiveSync = selectiveSync;

        // Apply custom config
        if (config) {
            this.config = { ...this.config, ...config };
        }

        // Bind handlers once in constructor
        this.boundHandleFileCreate = this.handleFileCreate.bind(this);
        this.boundHandleFileModify = this.handleFileModify.bind(this);
        this.boundHandleFileDelete = this.handleFileDelete.bind(this);
        this.boundHandleFileRename = this.handleFileRename.bind(this);
    }

    /**
     * Update configuration dynamically
     */
    setConfig(config: Partial<FileWatcherConfig>): void {
        this.config = { ...this.config, ...config };
    }

    /**
     * Get current debounce setting
     */
    getDebounceMs(): number {
        return this.config.debounceMs;
    }

    /**
     * Temporarily pause the file watcher (ignores all events)
     * Use this when making programmatic file changes that shouldn't trigger sync
     */
    pause(): void {
        this.isPaused = true;
        console.log('[FileWatcherService] Paused');
    }

    /**
     * Resume the file watcher after being paused
     */
    resume(): void {
        this.isPaused = false;
        console.log('[FileWatcherService] Resumed');
    }

    /**
     * Check if the watcher is currently paused
     */
    get paused(): boolean {
        return this.isPaused;
    }

    /**
     * Check if the watcher is currently active
     */
    get active(): boolean {
        return this.isActive;
    }

    async start(): Promise<void> {
        if (this.isActive) {
            console.log('[FileWatcherService] Already running');
            return;
        }

        this.isActive = true;
        console.log(
            '[FileWatcherService] Starting file watcher (debounce: %dms)',
            this.config.debounceMs,
        );

        // Register listeners for workspace file events
        this.app.workspace.on('file-create', this.boundHandleFileCreate);
        this.app.workspace.on('file-modify', this.boundHandleFileModify);
        this.app.workspace.on('file-delete', this.boundHandleFileDelete);
        this.app.workspace.on('file-rename', this.boundHandleFileRename);

        console.log('[FileWatcherService] File watcher started');
    }

    stop(): void {
        if (!this.isActive) return;

        console.log('[FileWatcherService] Stopping file watcher...');
        this.isActive = false;

        // Clear all debounce timers
        this.debounceTimers.forEach((timer) => {
            clearTimeout(timer);
        });
        this.debounceTimers.clear();

        // Clear batch timer
        if (this.batchTimer) {
            clearTimeout(this.batchTimer);
            this.batchTimer = null;
        }

        // Flush any pending changes
        if (this.pendingChanges.size > 0) {
            this.flushBatch();
        }

        // Remove event listeners using the same bound references
        this.app.workspace.off('file-create', this.boundHandleFileCreate);
        this.app.workspace.off('file-modify', this.boundHandleFileModify);
        this.app.workspace.off('file-delete', this.boundHandleFileDelete);
        this.app.workspace.off('file-rename', this.boundHandleFileRename);
        this.offAll();
        console.log('[FileWatcherService] File watcher stopped');
    }

    /**
     * Flush pending changes immediately (useful before app close)
     */
    flush(): void {
        this.flushBatch();
    }

    /**
     * Get number of pending (debounced) changes
     */
    getPendingCount(): number {
        return this.pendingChanges.size + this.debounceTimers.size;
    }

    /**
     * Handle file creation event
     */
    private async handleFileCreate(file: TFile): Promise<void> {
        const path = file.path;

        if (!this.shouldProcess(path)) return;

        console.log('[FileWatcherService] File create detected:', path);

        this.debounce(path, async () => {
            try {
                const content = await this.readFileWithRetry(path);
                const contentHash = await this.calculateHash(content);

                const event: FileChangeEvent = {
                    type: 'create',
                    path,
                    timestamp: new Date(),
                    contentHash,
                };

                this.addToBatch(event);
                this.trigger('change', event);
            } catch (error: any) {
                console.error('[FileWatcherService] Error handling file create:', error);
            }
        });
    }

    /**
     * Handle file modification event
     */
    private async handleFileModify(file: TFile): Promise<void> {
        const path = file.path;

        if (!this.shouldProcess(path)) return;

        console.log('[FileWatcherService] File modify detected:', path);

        this.debounce(path, async () => {
            try {
                const content = await this.readFileWithRetry(path);
                const contentHash = await this.calculateHash(content);

                const event: FileChangeEvent = {
                    type: 'modify',
                    path,
                    timestamp: new Date(),
                    contentHash,
                };

                this.addToBatch(event);
                this.trigger('change', event);
            } catch (error: any) {
                console.error('[FileWatcherService] Error handling file modify:', error);
            }
        });
    }

    /**
     * Handle file deletion event
     */
    private handleFileDelete(file: TAbstractFile): void {
        const path = file.path;

        console.log('[FileWatcherService] File delete detected:', path);

        // Directory deletions don't have .md extension, but we still need to process them
        const isDirectory = !path.endsWith('.md');
        
        if (isDirectory) {
            // Directory deletion - let SyncEngine handle it (will delete all child notes)
            console.log('[FileWatcherService] Directory delete detected:', path);
            
            // Skip normal shouldProcess check for directories
            if (!this.isActive || this.isPaused) return;
            if (this.selectiveSync.shouldIgnore(path)) return;
            
            const event: FileChangeEvent = {
                type: 'delete',
                path,
                timestamp: new Date(),
            };

            this.addToBatch(event);
            this.trigger('change', event);
            return;
        }

        // Normal file deletion
        if (!this.shouldProcess(path)) return;

        // Cancel any pending debounce for this path
        const existingTimer = this.debounceTimers.get(path);
        if (existingTimer) {
            clearTimeout(existingTimer);
            this.debounceTimers.delete(path);
        }

        // Delete events are immediate (no debounce needed)
        const event: FileChangeEvent = {
            type: 'delete',
            path,
            timestamp: new Date(),
        };

        this.addToBatch(event);
        this.trigger('change', event);
    }

    /**
     * Handle file rename event
     */
    private handleFileRename(file: TFile, oldPath: string): void {
        const newPath = file.path;

        console.log('[FileWatcherService] File rename detected:', oldPath, '->', newPath);

        // Directory renames don't have .md extension, but we still need to process them
        const isDirectory = !newPath.endsWith('.md') && !oldPath.endsWith('.md');
        
        if (isDirectory) {
            // Directory rename - let SyncEngine handle it (will rename all child notes)
            console.log('[FileWatcherService] Directory rename detected:', oldPath, '->', newPath);
            
            // Skip normal shouldProcess check for directories
            if (!this.isActive || this.isPaused) return;
            if (this.selectiveSync.shouldIgnore(newPath)) return;
            
            const event: FileChangeEvent = {
                type: 'rename',
                path: newPath,
                oldPath,
                timestamp: new Date(),
            };

            this.addToBatch(event);
            this.trigger('change', event);
            return;
        }

        // Normal file rename
        if (!this.shouldProcess(newPath)) return;

        // Cancel any pending debounce for old path
        const existingTimer = this.debounceTimers.get(oldPath);
        if (existingTimer) {
            clearTimeout(existingTimer);
            this.debounceTimers.delete(oldPath);
        }

        // Rename events are immediate
        const event: FileChangeEvent = {
            type: 'rename',
            path: newPath,
            oldPath,
            timestamp: new Date(),
        };

        this.addToBatch(event);
        this.trigger('change', event);
    }

    /**
     * Check if a path should be processed
     */
    private shouldProcess(path: string): boolean {
        if (!this.isActive || this.isPaused) return false;
        if (!path.endsWith('.md')) return false;
        if (this.selectiveSync.shouldIgnore(path)) return false;
        return true;
    }

    /**
     * Add event to batch and schedule flush
     */
    private addToBatch(event: FileChangeEvent): void {
        // Use path as key - newer events override older ones for same file
        this.pendingChanges.set(event.path, event);

        // Schedule batch flush
        if (!this.batchTimer) {
            this.batchTimer = setTimeout(() => {
                this.flushBatch();
            }, this.config.batchWindowMs);
        }
    }

    /**
     * Flush pending batch
     */
    private flushBatch(): void {
        if (this.batchTimer) {
            clearTimeout(this.batchTimer);
            this.batchTimer = null;
        }

        if (this.pendingChanges.size === 0) return;

        const batch: FileChangeBatch = {
            changes: Array.from(this.pendingChanges.values()),
            timestamp: new Date(),
        };

        this.pendingChanges.clear();

        console.log('[FileWatcherService] Flushing batch with %d changes', batch.changes.length);
        this.trigger('changes-batch', batch);
    }

    /**
     * Debounce file changes
     */
    private debounce(path: string, fn: () => Promise<void>): void {
        // Clear existing timer for this path
        const existingTimer = this.debounceTimers.get(path);
        if (existingTimer) {
            clearTimeout(existingTimer);
        }

        // Set new timer
        const timer = setTimeout(async () => {
            this.debounceTimers.delete(path);
            await fn();
        }, this.config.debounceMs);

        this.debounceTimers.set(path, timer);
    }

    /**
     * Read file with retry logic for transient failures
     */
    private async readFileWithRetry(path: string): Promise<string> {
        let lastError: Error | null = null;

        for (let attempt = 0; attempt < this.config.maxRetries; attempt++) {
            try {
                const content = await this.app.fileSystemManager.readFile(path);
                return content;
            } catch (error: any) {
                lastError = error as Error;

                if (attempt < this.config.maxRetries - 1) {
                    // Exponential backoff
                    const delay = this.config.retryDelayMs * 2 ** attempt;
                    await this.sleep(delay);
                }
            }
        }

        throw (
            lastError || new Error(`Failed to read file after ${this.config.maxRetries} attempts`)
        );
    }

    /**
     * Sleep helper for retry backoff
     */
    private sleep(ms: number): Promise<void> {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }

    /**
     * Calculate SHA-256 hash of content
     */
    private async calculateHash(content: string): Promise<string> {
        const encoder = new TextEncoder();
        const data = encoder.encode(content);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        return this.arrayBufferToBase64(hashBuffer);
    }

    /**
     * Convert ArrayBuffer to base64
     */
    private arrayBufferToBase64(buffer: ArrayBuffer): string {
        let binary = '';
        const bytes = new Uint8Array(buffer);
        for (let i = 0; i < bytes.byteLength; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return btoa(binary);
    }
}
