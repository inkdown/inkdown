import type { App } from '../App';
import { Events } from '../Events';
import { FileWatcherService } from './FileWatcherService';
import { NoteSyncService } from './NoteSyncService';
import { WebSocketService } from './WebSocketService';
import { ConflictResolver } from './ConflictResolver';
import { SelectiveSyncManager } from './SelectiveSyncManager';
import type { EncryptionManager } from './EncryptionManager';
import type { FileChangeEvent, NoteResponse } from './types';
import { loggers } from '../utils/logger';

export class SyncEngine extends Events {
    private app: App;
    private fileWatcher: FileWatcherService;
    private noteSyncService: NoteSyncService;
    private webSocketService: WebSocketService;
    private conflictResolver: ConflictResolver;
    private selectiveSync: SelectiveSyncManager;
    private encryptionManager: EncryptionManager;
    private logger = loggers.sync || loggers.app;

    // State
    private uploadQueue: FileChangeEvent[] = [];
    private isProcessingQueue = false;
    private noteVersions: Map<string, number> = new Map();
    private pathToNoteId: Map<string, string> = new Map();
    private noteIdToPath: Map<string, string> = new Map();
    private isRunning = false;

    constructor(
        app: App,
        baseURL: string,
        wsURL: string,
        encryptionManager: EncryptionManager
    ) {
        super();
        this.app = app;
        this.encryptionManager = encryptionManager;

        // Initialize components
        this.selectiveSync = new SelectiveSyncManager(app);
        this.fileWatcher = new FileWatcherService(app, this.selectiveSync);
        this.noteSyncService = new NoteSyncService(
            baseURL,
            encryptionManager,
            app.syncManager.tokenManager,
            app.syncManager.deviceManager
        );
        this.webSocketService = new WebSocketService(
            { url: wsURL },
            app.syncManager.tokenManager
        );
        this.conflictResolver = new ConflictResolver(app);
    }

    /**
     * Get WebSocketService instance (for injecting dependencies)
     */
    getWebSocketService(): WebSocketService {
        return this.webSocketService;
    }

    async start(): Promise<void> {
        if (this.isRunning) {
            this.logger.info('SyncEngine already running');
            return;
        }

        this.logger.info('Starting SyncEngine...');
        this.isRunning = true;

        try {
            // 0. Ensure authentication and encryption
            if (!this.app.syncManager.tokenRefresh.isAuthenticated()) {
                this.logger.info('Not authenticated, skipping sync start');
                this.isRunning = false;
                return;
            }

            // Try to restore encryption key from storage
            if (!this.encryptionManager.isInitialized()) {
                const token = await this.app.syncManager.tokenRefresh.ensureValidToken();
                const restored = await this.encryptionManager.restoreFromStorage(token);

                if (!restored) {
                    this.logger.warn('Encryption key not found in storage. User needs to enter password.');
                    // We can't proceed without encryption key
                    // The UI should prompt the user
                    this.isRunning = false;
                    return;
                }
                this.logger.info('Encryption key restored successfully.');
            }

            // 1. Initialize selective sync
            this.logger.info('Initializing selective sync...');
            await this.selectiveSync.init();

            // 2. Perform initial sync (download from server)
            this.logger.info('Calling performInitialSync...');
            await this.performInitialSync();
            this.logger.info('performInitialSync returned');

            // 3. Start file watcher for local changes
            this.logger.info('Starting file watcher...');
            await this.fileWatcher.start();
            this.fileWatcher.on('change', this.handleLocalChange.bind(this));
            this.logger.info('File watcher started.');

            // 4. Connect WebSocket for real-time updates
            this.logger.info('Connecting WebSocket...');
            await this.webSocketService.connect();
            this.webSocketService.on('note_update', this.handleRemoteUpdate.bind(this));
            this.webSocketService.on('note_delete', this.handleRemoteDelete.bind(this));
            this.webSocketService.on('conflict', this.handleConflict.bind(this));
            this.logger.info('WebSocket connected.');

            this.logger.info('SyncEngine started successfully');
        } catch (error) {
            this.logger.error('Failed to start SyncEngine:', error);
            this.isRunning = false;
            throw error;
        }
    }

    async stop(): Promise<void> {
        if (!this.isRunning) return;

        this.logger.info('Stopping SyncEngine...');
        this.isRunning = false;

        this.fileWatcher.stop();
        this.webSocketService.disconnect();

        // Clear queues
        this.uploadQueue = [];
        this.isProcessingQueue = false;

        this.logger.info('SyncEngine stopped');
    }

    private async performInitialSync(): Promise<void> {
        this.logger.info('Performing initial sync...');
        this.trigger('sync-start');

        try {
            const lastSync = await this.getLastSyncTime();
            const isFirstSync = lastSync.getTime() === 0;
            this.logger.info(`Last sync time: ${lastSync.toISOString()}, isFirstSync: ${isFirstSync}`);

            if (isFirstSync) {
                this.logger.info('First sync detected. Downloading all notes...');
                const notes = await this.noteSyncService.listNotes();
                this.logger.info(`Downloaded ${notes.length} notes`);

                for (const note of notes) {
                    await this.applyRemoteUpdate(note);
                }
            } else {
                this.logger.info(`Checking for changes since ${lastSync.toISOString()}`);
                const changes = await this.noteSyncService.getChangesSince(lastSync);
                this.logger.info(`Found ${changes.length} changes`);

                for (const change of changes) {
                    if (change.operation === 'update' && change.note) {
                        await this.applyRemoteUpdate(change.note);
                    } else if (change.operation === 'delete') {
                        await this.applyRemoteDelete(change.note_id);
                    }
                }
            }

            await this.saveLastSyncTime(new Date());
            this.logger.info('Initial sync complete');
            this.trigger('sync-complete');
        } catch (error) {
            this.logger.error('Initial sync failed:', error);
            this.trigger('sync-error', error);
            // Ensure we trigger complete so UI doesn't hang, or rely on error handling
            this.trigger('sync-complete');
            throw error;
        }
    }

    private async handleLocalChange(event: FileChangeEvent): Promise<void> {
        console.log('[SyncEngine] Local change detected:', event.type, event.path);

        // Add to upload queue
        this.uploadQueue.push(event);
        this.trigger('sync-count-change', this.uploadQueue.length);

        // Process queue (debounced)
        if (!this.isProcessingQueue) {
            await this.processUploadQueue();
        }
    }

    private async processUploadQueue(): Promise<void> {
        if (this.uploadQueue.length === 0) return;

        this.isProcessingQueue = true;
        this.trigger('sync-start');

        while (this.uploadQueue.length > 0) {
            const event = this.uploadQueue.shift()!;
            this.trigger('sync-count-change', this.uploadQueue.length);

            try {
                await this.uploadChange(event);
            } catch (error) {
                console.error('[SyncEngine] Upload failed:', error);
                // Could implement retry logic here
            }
        }

        this.isProcessingQueue = false;
        this.trigger('sync-complete');
    }

    private async uploadChange(event: FileChangeEvent): Promise<void> {
        const { type, path, contentHash } = event;

        if (type === 'delete') {
            await this.handleLocalDelete(path);
            return;
        }

        if (type === 'rename') {
            await this.handleLocalRename(event.oldPath!, path);
            return;
        }

        // Handle create/modify
        const file = this.app.workspace.getAbstractFileByPath(path) as any; // Cast to any to avoid TFile import issues for now
        if (!file) {
            console.warn(`[SyncEngine] File not found for upload: ${path}`);
            return;
        }

        const content = await this.app.fileManager.read(file);
        const title = this.extractTitle(path);

        // Encrypt content
        const encryptedTitle = await this.encryptionManager.encrypt(title);
        const encryptedContent = await this.encryptionManager.encrypt(content);

        // Check if note exists
        const existingNoteId = this.pathToNoteId.get(path);

        if (existingNoteId) {
            // Update existing note
            const currentVersion = this.noteVersions.get(path) || 0;

            const updatedNote = await this.noteSyncService.updateNote(existingNoteId, {
                encrypted_title: encryptedTitle.encrypted_content,
                encrypted_content: encryptedContent.encrypted_content,
                nonce: encryptedTitle.nonce,
                encryption_algo: 'AES-256-GCM',
                content_hash: contentHash,
                expected_version: currentVersion,
            });

            this.noteVersions.set(path, updatedNote.version);
            console.log(`[SyncEngine] Updated note ${existingNoteId} v${updatedNote.version}`);
        } else {
            // Create new note
            const newNote = await this.noteSyncService.createNote({
                type: 'file',
                encrypted_title: encryptedTitle.encrypted_content,
                encrypted_content: encryptedContent.encrypted_content,
                nonce: encryptedTitle.nonce,
                encryption_algo: 'AES-256-GCM',
                content_hash: contentHash,
            });

            this.mapPathToNote(path, newNote.id);
            this.noteVersions.set(path, newNote.version);
            console.log(`[SyncEngine] Created note ${newNote.id} v${newNote.version}`);
        }
    }

    private async handleLocalDelete(path: string): Promise<void> {
        const noteId = this.pathToNoteId.get(path);
        if (noteId) {
            await this.noteSyncService.deleteNote(noteId);
            this.unmapPath(path);
            console.log(`[SyncEngine] Deleted note ${noteId}`);
        }
    }

    private async handleLocalRename(oldPath: string, newPath: string): Promise<void> {
        const noteId = this.pathToNoteId.get(oldPath);
        if (noteId) {
            // Update mapping
            this.unmapPath(oldPath);
            this.mapPathToNote(newPath, noteId);

            // Update note title
            const newTitle = this.extractTitle(newPath);
            const encryptedTitle = await this.encryptionManager.encrypt(newTitle);

            await this.noteSyncService.updateNote(noteId, {
                encrypted_title: encryptedTitle.encrypted_content,
                nonce: encryptedTitle.nonce,
            });

            console.log(` [SyncEngine] Renamed note ${noteId}: ${oldPath} -> ${newPath}`);
        }
    }

    private async handleRemoteUpdate(payload: any): Promise<void> {
        console.log('[SyncEngine] Remote update received:', payload.note_id);

        // Skip if this update came from current device
        const deviceId = this.app.syncManager.deviceManager.getDeviceId();
        if (payload.device_id === deviceId) {
            return;
        }

        // Fetch full note
        const note = await this.noteSyncService.getNote(payload.note_id);
        await this.applyRemoteUpdate(note);
    }

    private async applyRemoteUpdate(note: NoteResponse): Promise<void> {
        try {
            // Decrypt
            const title = await this.encryptionManager.decrypt({
                encrypted_content: note.encrypted_title,
                nonce: note.nonce,
                encryption_algo: 'AES-256-GCM',
            });

            const content = note.encrypted_content
                ? await this.encryptionManager.decrypt({
                    encrypted_content: note.encrypted_content,
                    nonce: note.nonce,
                    encryption_algo: 'AES-256-GCM',
                })
                : '';

            // Determine path
            const existingPath = this.noteIdToPath.get(note.id);
            const path = existingPath || this.sanitizePath(title);

            // Check for local conflict
            const localExists = await this.app.fileSystemManager.exists(path);
            if (localExists) {
                const file = this.app.workspace.getAbstractFileByPath(path) as any;
                if (!file) return;

                const localContent = await this.app.fileManager.read(file);
                const localHash = await this.calculateHash(localContent);

                if (localHash !== note.content_hash) {
                    // CONFLICT!
                    console.warn('[SyncEngine] Conflict detected:', path);
                    const resolved = await this.conflictResolver.resolve(
                        path,
                        localContent,
                        content,
                        note
                    );
                    await this.app.fileManager.modify(file, resolved);
                } else {
                    // Already synced, skip
                    return;
                }
            } else {
                // New file, create locally
                await this.app.fileManager.createFile(path, content);
            }

            // Update tracking
            this.mapPathToNote(path, note.id);
            this.noteVersions.set(path, note.version);
            console.log(`[SyncEngine] Applied remote update: ${path} v${note.version}`);
            this.trigger('sync-remote-update', path);
        } catch (error) {
            console.error('[SyncEngine] Failed to apply remote update:', error);
            this.trigger('sync-error', error);
        }
    }

    private async handleRemoteDelete(payload: any): Promise<void> {
        await this.applyRemoteDelete(payload.note_id);
    }

    private async applyRemoteDelete(noteId: string): Promise<void> {
        const path = this.noteIdToPath.get(noteId);
        if (path) {
            const exists = await this.app.fileSystemManager.exists(path);
            if (exists) {
                const file = this.app.workspace.getAbstractFileByPath(path);
                if (file) {
                    await this.app.fileManager.trashFile(file);
                }
            }
            this.unmapPath(path);
            console.log(`[SyncEngine] Applied remote delete: ${path}`);
        }
    }

    private async handleConflict(payload: any): Promise<void> {
        console.warn('[SyncEngine] Conflict notification from server:', payload);
        // Server detected conflict, fetch and resolve
        const note = await this.noteSyncService.getNote(payload.note_id);
        await this.applyRemoteUpdate(note);
    }

    // Helper methods
    private extractTitle(path: string): string {
        return path.split('/').pop()!.replace(/\.md$/, '');
    }

    private sanitizePath(title: string): string {
        return `${title.replace(/[/\\?%*:|"<>]/g, '-')}.md`;
    }

    private async calculateHash(content: string): Promise<string> {
        const encoder = new TextEncoder();
        const data = encoder.encode(content);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        return this.arrayBufferToBase64(hashBuffer); // Use helper instead of manual map
    }


    private arrayBufferToBase64(buffer: ArrayBuffer): string {
        let binary = '';
        const bytes = new Uint8Array(buffer);
        for (let i = 0; i < bytes.byteLength; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return btoa(binary);
    }

    private mapPathToNote(path: string, noteId: string): void {
        this.pathToNoteId.set(path, noteId);
        this.noteIdToPath.set(noteId, path);
    }

    private unmapPath(path: string): void {
        const noteId = this.pathToNoteId.get(path);
        if (noteId) {
            this.noteIdToPath.delete(noteId);
        }
        this.pathToNoteId.delete(path);
        this.noteVersions.delete(path);
    }

    private async getLastSyncTime(): Promise<Date> {
        const config = await this.app.configManager.loadConfig<any>('sync');
        return config?.lastSyncTime ? new Date(config.lastSyncTime) : new Date(0);
    }

    private async saveLastSyncTime(time: Date): Promise<void> {
        const config = (await this.app.configManager.loadConfig<any>('sync')) || {};
        await this.app.configManager.saveConfig('sync', {
            ...config,
            lastSyncTime: time.toISOString(),
        });
    }

    // Public API
    getSelectiveSyncManager(): SelectiveSyncManager {
        return this.selectiveSync;
    }

    isActive(): boolean {
        return this.isRunning;
    }

    async sync(): Promise<void> {
        if (!this.isRunning) return;

        console.log('[SyncEngine] Manual sync triggered');
        this.trigger('sync-start');

        try {
            // Pull changes
            await this.performInitialSync();

            // Push changes
            await this.processUploadQueue();

            this.trigger('sync-complete');
        } catch (error) {
            console.error('[SyncEngine] Manual sync failed:', error);
            this.trigger('sync-error', error);
            throw error;
        }
    }

    getPendingChanges(): number {
        return this.uploadQueue.length;
    }

    isSyncing(): boolean {
        return this._isSyncing;
    }

    private setSyncing(value: boolean): void {
        this._isSyncing = value;
        if (value) {
            this.trigger('sync-start');
        } else {
            this.trigger('sync-complete');
        }
    }
}
