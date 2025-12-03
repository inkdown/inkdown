import type { App } from '../App';
import { Events } from '../Events';
import { FileWatcherService } from './FileWatcherService';
import { NoteSyncService } from './NoteSyncService';
import { WebSocketService } from './WebSocketService';
import { ConflictResolver } from './ConflictResolver';
import { SelectiveSyncManager } from './SelectiveSyncManager';
import { UploadQueue } from './UploadQueue';
import { LocalDatabase } from './LocalDatabase';
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
    private localDatabase: LocalDatabase;
    private logger = loggers.sync || loggers.app;

    // State
    private uploadQueue: UploadQueue;
    private isRunning = false;
    private isSyncingActive = false;

    constructor(
        app: App,
        baseURL: string,
        wsURL: string,
        encryptionManager: EncryptionManager,
        localDatabase: LocalDatabase
    ) {
        super();
        this.app = app;
        this.encryptionManager = encryptionManager;
        this.localDatabase = localDatabase;

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

        // Initialize upload queue with retry logic
        this.uploadQueue = new UploadQueue();
        this.uploadQueue.on('upload', this.handleUploadRequest.bind(this));
        this.uploadQueue.on('upload-success', (path: string) => {
            this.logger.info(`Upload successful: ${path}`);
        });
        this.uploadQueue.on('upload-retry', (data: any) => {
            this.logger.warn(`Retrying upload: ${data.path} (${data.attempts} attempts)`);
        });
        this.uploadQueue.on('upload-permanent-failure', (data: any) => {
            this.logger.error(`Upload failed permanently: ${data.path}`, data.error);
            // TODO: Notify user UI about permanent failure
            this.trigger('upload-failed', data);
        });
        this.uploadQueue.on('queue-change', (size: number) => {
            this.trigger('sync-count-change', size);
            // Emit sync-complete when queue becomes empty
            if (size === 0 && this.isSyncingActive) {
                this.isSyncingActive = false;
                this.trigger('sync-complete');
            }
        });
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

        // Clear upload queue
        this.uploadQueue.clear();

        this.logger.info('SyncEngine stopped');
    }

    private async performInitialSync(): Promise<void> {
        this.logger.info('Performing initial sync...');
        this.isSyncingActive = true;
        this.trigger('sync-start');

        try {
            const lastSync = await this.getLastSyncTime();
            const isFirstSync = lastSync.getTime() === 0;
            this.logger.info(`Last sync time: ${lastSync.toISOString()}, isFirstSync: ${isFirstSync}`);

            if (isFirstSync) {
                this.logger.info('First sync detected. Downloading all notes...');
                const notesResponse = await this.noteSyncService.listNotes();
                // Handle null/undefined response from server
                const notes = notesResponse || [];
                this.logger.info(`Downloaded ${notes.length} notes`);

                for (const note of notes) {
                    await this.applyRemoteUpdate(note);
                }
            } else {
                this.logger.info(`Checking for changes since ${lastSync.toISOString()}`);
                const changesResponse = await this.noteSyncService.getChangesSince(lastSync);
                // Handle null/undefined response from server
                const changes = changesResponse || [];
                this.logger.info(`Found ${changes.length} changes`);

                for (const change of changes) {
                    if (change.operation === 'update' && change.note) {
                        await this.applyRemoteUpdate(change.note);
                    } else if (change.operation === 'delete') {
                        await this.applyRemoteDelete(change.note_id);
                    }
                }
            }

            // ALWAYS scan for local files that need to be uploaded
            // This handles:
            // 1. First sync with local files
            // 2. Files created while offline
            // 3. Files not yet mapped to remote notes
            await this.scanAndUploadLocalFiles();

            await this.saveLastSyncTime(new Date());
            this.logger.info('Initial sync complete');
            
            // Only emit sync-complete if queue is empty (no pending uploads)
            if (this.uploadQueue.size() === 0) {
                this.isSyncingActive = false;
                this.trigger('sync-complete');
            }
            // If queue has items, sync-complete will be emitted when queue empties
        } catch (error) {
            this.logger.error('Initial sync failed:', error);
            this.isSyncingActive = false;
            this.trigger('sync-error', error);
            // Ensure we trigger complete so UI doesn't hang, or rely on error handling
            this.trigger('sync-complete');
            throw error;
        }
    }

    private async scanAndUploadLocalFiles(): Promise<void> {
        this.logger.info('Scanning for local files to upload...');

        try {
            const files = await this.app.workspace.getFiles(['md']);
            this.logger.info(`Found ${files.length} markdown files in workspace`);

            let uploadCount = 0;
            let modifiedCount = 0;

            for (const file of files) {
                this.logger.debug(`Checking file: ${file.path}`);

                // Check if already mapped
                const noteId = await this.localDatabase.getNoteIdByPath(file.path);
                if (!noteId) {
                    // Not mapped, queue for upload as new file
                    this.logger.info(`Found unmapped local file: ${file.path}, queuing for upload`);

                    const content = await this.app.fileManager.read(file);
                    const contentHash = await this.calculateHash(content);

                    this.uploadQueue.enqueue({
                        type: 'create',
                        path: file.path,
                        contentHash: contentHash,
                        timestamp: new Date()
                    });
                    uploadCount++;
                } else {
                    // File is mapped, check if content has changed
                    const content = await this.app.fileManager.read(file);
                    const localHash = await this.calculateHash(content);
                    const storedHash = await this.localDatabase.getContentHash(file.path);
                    
                    if (storedHash && localHash !== storedHash) {
                        // Content has changed since last sync
                        this.logger.info(`Found modified local file: ${file.path}, queuing for update`);
                        
                        this.uploadQueue.enqueue({
                            type: 'modify',
                            path: file.path,
                            contentHash: localHash,
                            timestamp: new Date()
                        });
                        modifiedCount++;
                    } else {
                        this.logger.debug(`File unchanged: ${file.path}`);
                    }
                }
            }

            this.logger.info(`Queued ${uploadCount} new files, ${modifiedCount} modified files for upload`);
            this.logger.info(`Upload queue size: ${this.uploadQueue.size()}`);
        } catch (error) {
            this.logger.error('Error scanning local files:', error);
            throw error;
        }
    }

    private async handleLocalChange(event: FileChangeEvent): Promise<void> {
        console.log('[SyncEngine] Local change detected:', event.type, event.path);

        // Add to upload queue with retry logic
        this.uploadQueue.enqueue(event);
    }

    /**
     * Handle upload request from queue
     * Called by UploadQueue when an item is ready to be uploaded
     */
    private async handleUploadRequest(event: FileChangeEvent): Promise<void> {
        // Only emit sync-start once when we start processing
        if (!this.isSyncingActive) {
            this.isSyncingActive = true;
            this.trigger('sync-start');
        }

        try {
            await this.uploadChange(event);
            // Mark as successful in queue
            this.uploadQueue.markSuccess(event.path);
        } catch (error) {
            console.error('[SyncEngine] Upload failed:', error);
            // Mark as failed - queue will handle retry logic
            this.uploadQueue.markFailure(event.path, error as Error);
        }
        // Note: sync-complete is emitted by queue-change handler when queue becomes empty
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
        const existingNoteId = await this.localDatabase.getNoteIdByPath(path);

        if (existingNoteId) {
            // Update existing note with version check
            const currentVersion = (await this.localDatabase.getNoteVersion(path)) || 0;

            try {
                const updatedNote = await this.noteSyncService.updateNote(existingNoteId, {
                    encrypted_title: encryptedTitle.encrypted_content,
                    encrypted_content: encryptedContent.encrypted_content,
                    nonce: encryptedTitle.nonce,
                    encryption_algo: 'AES-256-GCM',
                    content_hash: contentHash,
                    expected_version: currentVersion,
                });

                await this.localDatabase.saveNoteVersion(path, updatedNote.version, existingNoteId, contentHash);
                console.log(`[SyncEngine] Updated note ${existingNoteId} v${updatedNote.version}`);
            } catch (error: any) {
                // Check if it's a version conflict (409 Conflict)
                if (error?.message?.includes('409') || error?.message?.includes('conflict') || error?.message?.includes('version')) {
                    this.logger.warn(`Version conflict detected for ${path}, resolving...`);

                    // Fetch the latest version from server
                    const remoteNote = await this.noteSyncService.getNote(existingNoteId);

                    // Apply remote update (this will trigger conflict resolution)
                    await this.applyRemoteUpdate(remoteNote);

                    // After conflict resolution, retry the upload
                    // The conflict resolver should have updated the local file
                    const updatedContent = await this.app.fileManager.read(file);
                    const updatedEncrypted = await this.encryptionManager.encrypt(updatedContent);
                    const updatedTitleEncrypted = await this.encryptionManager.encrypt(title);

                    const retriedNote = await this.noteSyncService.updateNote(existingNoteId, {
                        encrypted_title: updatedTitleEncrypted.encrypted_content,
                        encrypted_content: updatedEncrypted.encrypted_content,
                        nonce: updatedTitleEncrypted.nonce,
                        encryption_algo: 'AES-256-GCM',
                        content_hash: await this.calculateHash(updatedContent),
                        expected_version: remoteNote.version,  // Use remote version now
                    });

                    const retriedHash = await this.calculateHash(updatedContent);
                    await this.localDatabase.saveNoteVersion(path, retriedNote.version, existingNoteId, retriedHash);
                    console.log(`[SyncEngine] Conflict resolved and note updated: ${existingNoteId} v${retriedNote.version}`);
                } else {
                    // Not a version conflict, rethrow
                    throw error;
                }
            }
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

            await this.mapPathToNote(path, newNote.id);
            await this.localDatabase.saveNoteVersion(path, newNote.version, newNote.id, contentHash);
            console.log(`[SyncEngine] Created note ${newNote.id} v${newNote.version}`);
        }
    }

    private async handleLocalDelete(path: string): Promise<void> {
        const noteId = await this.localDatabase.getNoteIdByPath(path);
        if (noteId) {
            await this.noteSyncService.deleteNote(noteId);
            await this.unmapPath(path);
            console.log(`[SyncEngine] Deleted note ${noteId}`);
        }
    }

    private async handleLocalRename(oldPath: string, newPath: string): Promise<void> {
        const noteId = await this.localDatabase.getNoteIdByPath(oldPath);
        if (noteId) {
            // Update mapping
            await this.unmapPath(oldPath);
            await this.mapPathToNote(newPath, noteId);

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
            const existingPath = await this.localDatabase.getPathByNoteId(note.id);
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
            await this.mapPathToNote(path, note.id);
            await this.localDatabase.saveNoteVersion(path, note.version, note.id, note.content_hash);
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
        const path = await this.localDatabase.getPathByNoteId(noteId);
        if (path) {
            const exists = await this.app.fileSystemManager.exists(path);
            if (exists) {
                const file = this.app.workspace.getAbstractFileByPath(path);
                if (file) {
                    await this.app.fileManager.trashFile(file);
                }
            }
            await this.unmapPath(path);
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

    private async mapPathToNote(path: string, noteId: string): Promise<void> {
        await this.localDatabase.savePathMapping(path, noteId);
    }

    private async unmapPath(path: string): Promise<void> {
        await this.localDatabase.deletePathMapping(path);
        await this.localDatabase.deleteNoteVersion(path);
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

        try {
            // Pull changes (performInitialSync handles sync-start/complete)
            await this.performInitialSync();

            // Push pending changes - process immediately
            const pending = this.uploadQueue.getPending();
            if (pending.length > 0) {
                this.logger.info(`Processing ${pending.length} pending uploads...`);
                for (const event of pending) {
                    await this.handleUploadRequest(event);
                }
            }

            // Ensure sync-complete is emitted if nothing was pending
            if (this.uploadQueue.size() === 0 && this.isSyncingActive) {
                this.isSyncingActive = false;
                this.trigger('sync-complete');
            }
        } catch (error) {
            console.error('[SyncEngine] Manual sync failed:', error);
            this.isSyncingActive = false;
            this.trigger('sync-error', error);
            throw error;
        }
    }

    getPendingChanges(): number {
        return this.uploadQueue.size();
    }

    isSyncing(): boolean {
        return this.isSyncingActive;
    }
}
