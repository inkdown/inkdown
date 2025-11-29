import type { App } from '../App';
import { Events } from '../Events';
import type { SelectiveSyncManager } from './SelectiveSyncManager';
import type { FileChangeEvent } from './types';

export class FileWatcherService extends Events {
    private app: App;
    private selectiveSync: SelectiveSyncManager;
    private debounceTimers: Map<string, NodeJS.Timeout> = new Map();
    private readonly DEBOUNCE_MS = 1000;
    private isActive = false;

    constructor(app: App, selectiveSync: SelectiveSyncManager) {
        super();
        this.app = app;
        this.selectiveSync = selectiveSync;
    }

    async start(): Promise<void> {
        if (this.isActive) {
            console.log('[FileWatcherService] Already running');
            return;
        }

        this.isActive = true;
        console.log('[FileWatcherService] Starting file watcher...');

        // Register listeners for workspace file events
        this.app.workspace.on('file-create', this.handleFileCreate.bind(this));
        this.app.workspace.on('file-modify', this.handleFileModify.bind(this));
        this.app.workspace.on('file-delete', this.handleFileDelete.bind(this));
        this.app.workspace.on('file-rename', this.handleFileRename.bind(this));

        console.log('[FileWatcherService] File watcher started');
    }

    stop(): void {
        if (!this.isActive) return;

        console.log('[FileWatcherService] Stopping file watcher...');
        this.isActive = false;

        // Clear all debounce timers
        this.debounceTimers.forEach(timer => clearTimeout(timer));
        this.debounceTimers.clear();

        // Remove event listeners
        this.app.workspace.off('file-create', this.handleFileCreate.bind(this));
        this.app.workspace.off('file-modify', this.handleFileModify.bind(this));
        this.app.workspace.off('file-delete', this.handleFileDelete.bind(this));
        this.offAll();
        console.log('[FileWatcherService] File watcher stopped');
    }

    private async handleFileCreate(path: string): Promise<void> {
        if (!this.isActive || this.selectiveSync.shouldIgnore(path)) return;

        this.debounce(path, async () => {
            try {
                const file = this.app.workspace.getAbstractFileByPath(path) as any;
                if (!file) return;

                const content = await this.app.fileManager.read(file);
                const contentHash = await this.calculateHash(content);

                this.trigger('change', {
                    type: 'create',
                    path,
                    timestamp: new Date(),
                    contentHash,
                } as FileChangeEvent);
            } catch (error) {
                console.error('[FileWatcherService] Error handling file create:', error);
            }
        });
    }

    private async handleFileModify(path: string): Promise<void> {
        if (!this.isActive || this.selectiveSync.shouldIgnore(path)) return;

        this.debounce(path, async () => {
            try {
                const file = this.app.workspace.getAbstractFileByPath(path) as any;
                if (!file) return;

                const content = await this.app.fileManager.read(file);
                const contentHash = await this.calculateHash(content);

                this.trigger('change', {
                    type: 'modify',
                    path,
                    timestamp: new Date(),
                    contentHash,
                } as FileChangeEvent);
            } catch (error) {
                console.error('[FileWatcherService] Error handling file modify:', error);
            }
        });
    }

    private handleFileDelete(path: string): void {
        if (!this.isActive || this.selectiveSync.shouldIgnore(path)) return;

        // No debounce for delete - immediate action
        this.trigger('change', {
            type: 'delete',
            path,
            timestamp: new Date(),
        } as FileChangeEvent);
    }

    private handleFileRename(oldPath: string, newPath: string): void {
        if (!this.isActive || this.selectiveSync.shouldIgnore(newPath)) return;

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
