import type { App } from '../App';
import { Events } from '../Events';
import type { SelectiveSyncManager } from './SelectiveSyncManager';
import type { FileChangeEvent } from './types';
import type { TFile, TAbstractFile } from '../managers/Workspace';

export class FileWatcherService extends Events {
    private app: App;
    private selectiveSync: SelectiveSyncManager;
    private debounceTimers: Map<string, NodeJS.Timeout> = new Map();
    private readonly DEBOUNCE_MS = 1000;
    private isActive = false;

    // Store bound handlers so we can properly remove them
    private boundHandleFileCreate: (file: TFile) => void;
    private boundHandleFileModify: (file: TFile) => void;
    private boundHandleFileDelete: (file: TAbstractFile) => void;
    private boundHandleFileRename: (file: TFile, oldPath: string) => void;

    constructor(app: App, selectiveSync: SelectiveSyncManager) {
        super();
        this.app = app;
        this.selectiveSync = selectiveSync;

        // Bind handlers once in constructor
        this.boundHandleFileCreate = this.handleFileCreate.bind(this);
        this.boundHandleFileModify = this.handleFileModify.bind(this);
        this.boundHandleFileDelete = this.handleFileDelete.bind(this);
        this.boundHandleFileRename = this.handleFileRename.bind(this);
    }

    async start(): Promise<void> {
        if (this.isActive) {
            console.log('[FileWatcherService] Already running');
            return;
        }

        this.isActive = true;
        console.log('[FileWatcherService] Starting file watcher...');

        // Register listeners for workspace file events
        // Note: Workspace events pass TFile/TAbstractFile objects, not paths
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
        this.debounceTimers.forEach(timer => clearTimeout(timer));
        this.debounceTimers.clear();

        // Remove event listeners using the same bound references
        this.app.workspace.off('file-create', this.boundHandleFileCreate);
        this.app.workspace.off('file-modify', this.boundHandleFileModify);
        this.app.workspace.off('file-delete', this.boundHandleFileDelete);
        this.app.workspace.off('file-rename', this.boundHandleFileRename);
        this.offAll();
        console.log('[FileWatcherService] File watcher stopped');
    }

    /**
     * Handle file creation event
     * @param file - The created TFile object
     */
    private async handleFileCreate(file: TFile): Promise<void> {
        const path = file.path;
        
        // Only sync markdown files
        if (!path.endsWith('.md')) {
            console.log('[FileWatcherService] Ignoring non-markdown file:', path);
            return;
        }
        
        if (!this.isActive || this.selectiveSync.shouldIgnore(path)) return;

        console.log('[FileWatcherService] File create detected:', path);

        // Store path for use in debounced callback (file reference may become stale)
        const filePath = path;

        this.debounce(path, async () => {
            try {
                // Read content directly using fileSystemManager (more reliable than re-fetching TFile)
                const content = await this.app.fileSystemManager.readFile(filePath);
                const contentHash = await this.calculateHash(content);

                console.log('[FileWatcherService] Triggering change event for create:', filePath);
                this.trigger('change', {
                    type: 'create',
                    path: filePath,
                    timestamp: new Date(),
                    contentHash,
                } as FileChangeEvent);
            } catch (error) {
                console.error('[FileWatcherService] Error handling file create:', error);
            }
        });
    }

    /**
     * Handle file modification event
     * @param file - The modified TFile object
     */
    private async handleFileModify(file: TFile): Promise<void> {
        const path = file.path;
        
        // Only sync markdown files
        if (!path.endsWith('.md')) {
            return;
        }
        
        if (!this.isActive || this.selectiveSync.shouldIgnore(path)) return;

        console.log('[FileWatcherService] File modify detected:', path);

        // Store path for use in debounced callback (file reference may become stale)
        const filePath = path;

        this.debounce(path, async () => {
            try {
                // Read content directly using fileSystemManager (more reliable than re-fetching TFile)
                const content = await this.app.fileSystemManager.readFile(filePath);
                const contentHash = await this.calculateHash(content);

                console.log('[FileWatcherService] Triggering change event for modify:', filePath);
                this.trigger('change', {
                    type: 'modify',
                    path: filePath,
                    timestamp: new Date(),
                    contentHash,
                } as FileChangeEvent);
            } catch (error) {
                console.error('[FileWatcherService] Error handling file modify:', error);
            }
        });
    }

    /**
     * Handle file deletion event
     * @param file - The deleted TAbstractFile object
     */
    private handleFileDelete(file: TAbstractFile): void {
        const path = file.path;
        
        // Only sync markdown files
        if (!path.endsWith('.md')) {
            return;
        }
        
        if (!this.isActive || this.selectiveSync.shouldIgnore(path)) return;

        console.log('[FileWatcherService] File delete detected:', path);

        // No debounce for delete - immediate action
        this.trigger('change', {
            type: 'delete',
            path,
            timestamp: new Date(),
        } as FileChangeEvent);
    }

    /**
     * Handle file rename event
     * @param file - The renamed TFile object (with new path)
     * @param oldPath - The previous path of the file
     */
    private handleFileRename(file: TFile, oldPath: string): void {
        const newPath = file.path;
        
        // Only sync markdown files
        if (!newPath.endsWith('.md')) {
            return;
        }
        
        if (!this.isActive || this.selectiveSync.shouldIgnore(newPath)) return;

        console.log('[FileWatcherService] File rename detected:', oldPath, '->', newPath);

        this.trigger('change', {
            type: 'rename',
            path: newPath,
            oldPath,
            timestamp: new Date(),
        } as FileChangeEvent);
    }

    private debounce(path: string, fn: () => Promise<void>): void {
        // Clear existing timer for this path
        const existingTimer = this.debounceTimers.get(path);
        if (existingTimer) {
            clearTimeout(existingTimer);
        }

        // Set new timer
        const timer = setTimeout(async () => {
            await fn();
            this.debounceTimers.delete(path);
        }, this.DEBOUNCE_MS);

        this.debounceTimers.set(path, timer);
    }

    private async calculateHash(content: string): Promise<string> {
        const encoder = new TextEncoder();
        const data = encoder.encode(content);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        return this.arrayBufferToBase64(hashBuffer);
    }

    private arrayBufferToBase64(buffer: ArrayBuffer): string {
        let binary = '';
        const bytes = new Uint8Array(buffer);
        for (let i = 0; i < bytes.byteLength; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return btoa(binary);
    }
}
