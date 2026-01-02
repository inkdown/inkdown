import type { App } from '../App';
import { Events } from '../Events';
import { loggers } from '../utils/logger';
import { ConflictResolver } from './ConflictResolver';
import type { EncryptionManager } from './EncryptionManager';
import { FileWatcherService } from './FileWatcherService';
import type { LocalDatabase } from './LocalDatabase';
import { NoteSyncService } from './NoteSyncService';
import { SelectiveSyncManager } from './SelectiveSyncManager';
import { getSyncLogger } from './SyncLogger';
import type { FileChangeEvent, LocalNoteInfo, NoteResponse, SyncVerificationResult } from './types';
import { UploadQueue } from './UploadQueue';
import { WebSocketService } from './WebSocketService';

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
    private syncLogger = getSyncLogger();

    // State
    private uploadQueue: UploadQueue;
    private isRunning = false;
    private isSyncingActive = false;
    private workspaceId: string | undefined;

    constructor(
        app: App,
        baseURL: string,
        wsURL: string,
        encryptionManager: EncryptionManager,
        localDatabase: LocalDatabase,
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
            app.syncManager.tokenManager,
            app.syncManager.deviceManager,
        );
        this.webSocketService = new WebSocketService({ url: wsURL }, app.syncManager.tokenManager);
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

    /**
     * Set the workspace ID for sync operations
     */
    setWorkspaceId(workspaceId: string | undefined): void {
        this.workspaceId = workspaceId;
        this.logger.info(`Workspace ID set to: ${workspaceId || 'none'}`);
    }

    /**
     * Get the current workspace ID
     */
    getWorkspaceId(): string | undefined {
        return this.workspaceId;
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
                // Try to restore from last-used password in memory first
                const lastPassword = this.app.syncManager.getLastPassword();

                if (lastPassword) {
                    const restored = await this.encryptionManager.restoreFromPassword(lastPassword);

                    if (restored) {
                        this.logger.info('Encryption key restored from password');
                    } else {
                        this.logger.warn('Failed to restore - password may have changed');
                        this.isRunning = false;
                        this.trigger('encryption-required');
                        return;
                    }
                } else {
                    this.logger.warn('No password available - user needs to enter password');
                    this.isRunning = false;
                    this.trigger('encryption-required');
                    return;
                }
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

            // 5. Start periodic scan for undetected changes
            this.startPeriodicScan();

            this.logger.info('SyncEngine started successfully');
        } catch (error: any) {
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
        this.stopPeriodicScan();

        // Clear upload queue
        this.uploadQueue.clear();

        this.logger.info('SyncEngine stopped');
    }

    private async performInitialSync(): Promise<void> {
        this.logger.info('Performing initial sync with full reconciliation...');
        this.isSyncingActive = true;
        this.trigger('sync-start');

        try {
            // Use full reconciliation for robust sync
            await this.performFullReconciliation();

            await this.saveLastSyncTime(new Date());
            this.logger.info('Initial sync complete');

            // ALWAYS emit sync-count-change with actual queue size to reset UI state
            const queueSize = this.uploadQueue.size();
            this.trigger('sync-count-change', queueSize);

            if (queueSize === 0) {
                this.isSyncingActive = false;
                this.trigger('sync-complete');
            }
            // If queue has items, sync-complete will be emitted when queue empties
        } catch (error: any) {
            this.logger.error('Initial sync failed:', error);
            this.isSyncingActive = false;
            // Reset count on error too
            this.trigger('sync-count-change', 0);
            this.trigger('sync-error', error);
            this.trigger('sync-complete');
            throw error;
        }
    }

    /**
     * Perform full reconciliation between local and server state
     * This is the core of reliable sync - compares everything
     */
    private async performFullReconciliation(): Promise<void> {
        this.logger.info('Starting full reconciliation...');
        this.syncLogger.info('Starting full reconciliation', undefined, 'Sync');

        // 1. Get manifest from server (compact list of all notes)
        const manifest = await this.noteSyncService.getManifest(this.workspaceId);
        const manifestNotes = manifest?.notes || [];
        this.logger.info(`Server manifest: ${manifestNotes.length} notes`);
        this.syncLogger.info(`Server has ${manifestNotes.length} notes`, undefined, 'Sync');

        // 2. Get all local markdown files
        const localFiles = await this.app.workspace.getFiles(['md']);
        this.logger.info(`Local files: ${localFiles.length} markdown files`);

        // 3. Build server map for quick lookup
        const serverNoteIds = new Set(manifestNotes.map((n) => n.id));
        const serverMap = new Map(manifestNotes.map((n) => [n.id, n]));

        // 4. Build local state for batch diff
        const localNotes: LocalNoteInfo[] = [];
        const unmappedFiles: string[] = [];
        const orphanedFiles: string[] = []; // Files with IDs that don't exist on server
        const localFileMap = new Map<string, { path: string; hash: string }>();

        for (const file of localFiles) {
            // Skip ignored files
            if (this.selectiveSync.shouldIgnore(file.path)) {
                continue;
            }

            const content = await this.app.fileManager.read(file);
            const localHash = await this.calculateHash(content);
            localFileMap.set(file.path, { path: file.path, hash: localHash });

            const noteId = await this.localDatabase.getNoteIdByPath(file.path);
            if (noteId) {
                // Check if this ID actually exists on the server
                if (serverNoteIds.has(noteId)) {
                    // Valid mapping - include in batch diff
                    const storedVersion = (await this.localDatabase.getNoteVersion(file.path)) || 0;
                    localNotes.push({
                        id: noteId,
                        content_hash: localHash,
                        version: storedVersion,
                    });
                } else {
                    // Orphaned mapping - ID doesn't exist on server anymore
                    // This can happen after account change, server reset, etc.
                    this.logger.warn(
                        `Orphaned mapping detected: ${file.path} -> ${noteId} (not on server)`,
                    );
                    orphanedFiles.push(file.path);
                    // Clear the invalid mapping
                    await this.localDatabase.deletePathMapping(file.path);
                }
            } else {
                unmappedFiles.push(file.path);
            }
        }

        this.logger.info(
            `Mapped files: ${localNotes.length}, Unmapped files: ${unmappedFiles.length}, Orphaned files: ${orphanedFiles.length}`,
        );
        this.syncLogger.info(
            `Local: ${localNotes.length} mapped, ${unmappedFiles.length} new, ${orphanedFiles.length} orphaned`,
            undefined,
            'Sync',
        );

        // 5. Use batch diff for efficient comparison
        if (localNotes.length > 0 && this.workspaceId) {
            const diff = await this.noteSyncService.batchDiff(this.workspaceId, localNotes);

            this.logger.info(
                `Batch diff result: ${diff.to_download.length} to download, ${diff.to_upload.length} to upload, ${diff.to_delete.length} to delete, ${diff.conflicts.length} conflicts`,
            );
            this.syncLogger.info(
                `Diff: ${diff.to_download.length} download, ${diff.to_upload.length} upload, ${diff.conflicts.length} conflicts`,
                undefined,
                'Sync',
            );

            // Process downloads (server has newer version)
            for (const note of diff.to_download) {
                await this.applyRemoteUpdate(note);
            }

            // Process uploads (local has newer version)
            for (const noteId of diff.to_upload) {
                const path = await this.localDatabase.getPathByNoteId(noteId);
                if (path) {
                    const fileData = localFileMap.get(path);
                    if (fileData) {
                        this.uploadQueue.enqueue({
                            type: 'modify',
                            path: path,
                            contentHash: fileData.hash,
                            timestamp: new Date(),
                        });
                    }
                }
            }

            // Process deletes (deleted on server)
            for (const noteId of diff.to_delete) {
                await this.applyRemoteDelete(noteId);
            }

            // Handle conflicts
            for (const conflict of diff.conflicts) {
                await this.handleSyncConflict(conflict);
            }
        }

        // 6. Check for notes on server that we don't have locally
        // This handles cases where batchDiff might not return missing notes (e.g. empty local state)
        const mappedNoteIds = new Set(localNotes.map((n) => n.id));
        for (const [noteId, entry] of serverMap) {
            // If note is not mapped locally AND not deleted on server
            if (!mappedNoteIds.has(noteId) && !entry.is_deleted) {
                // We don't have this note locally - download it
                this.logger.info(`Downloading missing note: ${noteId}`);
                const note = await this.noteSyncService.getNote(noteId);
                await this.applyRemoteUpdate(note);
            }
        }

        // 7. Upload unmapped local files (new files not yet on server)
        const filesToUpload = [...unmappedFiles, ...orphanedFiles];

        if (filesToUpload.length > 0) {
            // CRITICAL: Pause queue BEFORE enqueueing to prevent timer-based processing
            // from starting. This prevents the race condition where both processUploadQueue()
            // and handleUploadRequest() try to upload the same file concurrently.
            this.uploadQueue.pause();

            for (const path of filesToUpload) {
                const fileData = localFileMap.get(path);
                if (fileData) {
                    this.logger.info(`Uploading new local file: ${path}`);
                    this.uploadQueue.enqueue({
                        type: 'create',
                        path: path,
                        contentHash: fileData.hash,
                        timestamp: new Date(),
                    });
                }
            }

            // 8. Process upload queue immediately during initial sync
            this.logger.info(`Processing ${filesToUpload.length} files for upload...`);
            await this.processUploadQueue();
            // Note: processUploadQueue() resumes the queue when done
        }

        // 9. Update local content hashes for accurate future comparisons
        for (const [path, data] of localFileMap) {
            await this.localDatabase.updateContentHash(path, data.hash);
        }

        // 10. Cleanup orphaned mappings (files that were deleted locally but still have mappings)
        const allMappings = await this.localDatabase.getAllPathMappings();
        let orphanedCount = 0;
        for (const { path, noteId } of allMappings) {
            // Check if file is in local map OR exists on disk (localFileMap might be stale after downloads)
            if (!localFileMap.has(path)) {
                const exists = await this.app.fileSystemManager.exists(path);
                if (!exists) {
                    this.logger.info(`Found orphaned mapping: ${path} -> ${noteId}. Removing...`);
                    await this.unmapPath(path);
                    orphanedCount++;
                }
            }
        }
        if (orphanedCount > 0) {
            this.logger.info(`Cleaned up ${orphanedCount} orphaned mappings`);
        }

        this.logger.info('Full reconciliation complete');
    }

    /**
     * Handle a sync conflict detected during reconciliation
     */
    private async handleSyncConflict(conflict: {
        note_id: string;
        local_hash: string;
        server_hash: string;
        local_version: number;
        server_version: number;
    }): Promise<void> {
        this.logger.warn(`Handling conflict for note ${conflict.note_id}`);

        const path = await this.localDatabase.getPathByNoteId(conflict.note_id);
        if (!path) {
            this.logger.error(`Cannot resolve conflict: no path mapping for ${conflict.note_id}`);
            return;
        }

        // Fetch server version
        const serverNote = await this.noteSyncService.getNote(conflict.note_id);

        // Get local content
        const file = this.app.workspace.getAbstractFileByPath(path) as any;
        if (!file) {
            this.logger.error(`Cannot resolve conflict: file not found ${path}`);
            return;
        }

        const localContent = await this.app.fileManager.read(file);

        // Decrypt server content using embedded nonce format with legacy fallback
        const serverContent = serverNote.encrypted_content
            ? await this.decryptWithFallback(serverNote.encrypted_content, serverNote.nonce)
            : '';

        // Register conflict in logger for UI
        this.syncLogger.addConflict({
            noteId: conflict.note_id,
            path,
            localVersion: conflict.local_version,
            serverVersion: conflict.server_version,
            localContent,
            serverContent,
            localHash: conflict.local_hash,
            serverHash: conflict.server_hash,
        });

        // Attempt to resolve conflict
        const resolution = await this.conflictResolver.resolve(
            path,
            localContent,
            serverContent,
            serverNote,
        );

        if (resolution.type === 'needs-user-decision') {
            // Hard conflict - leave for user to resolve in SyncModal
            this.syncLogger.warn(
                `Hard conflict for ${path} - user must resolve manually`,
                'Check Sync Status for conflict resolution options',
            );
            return;
        }

        // Auto-merge succeeded - update local file with resolved content
        this.fileWatcher.pause();
        try {
            await this.app.fileManager.modify(file, resolution.content);
        } finally {
            this.fileWatcher.resume();
        }

        // Mark conflict as resolved
        const addedConflict = this.syncLogger.getConflicts().find(c => c.path === path && !c.resolved);
        if (addedConflict) {
            this.syncLogger.resolveConflict(addedConflict.id, 'merged');
        }

        // Queue upload of resolved version
        const resolvedHash = await this.calculateHash(resolution.content);
        this.uploadQueue.enqueue({
            type: 'modify',
            path: path,
            contentHash: resolvedHash,
            timestamp: new Date(),
        });
        
        this.syncLogger.info(`Conflict auto-resolved for ${path} using ${resolution.strategy}`);
    }

    // private async scanAndUploadLocalFiles(): Promise<void> {
    //     this.logger.info('Scanning for local files to upload...');

    //     try {
    //         const files = await this.app.workspace.getFiles(['md']);
    //         this.logger.info(`Found ${files.length} markdown files in workspace`);

    //         let uploadCount = 0;
    //         let modifiedCount = 0;

    //         for (const file of files) {
    //             this.logger.debug(`Checking file: ${file.path}`);

    //             // Check if already mapped
    //             const noteId = await this.localDatabase.getNoteIdByPath(file.path);
    //             if (noteId) {
    //                 // File is mapped, check if content has changed
    //                 const content = await this.app.fileManager.read(file);
    //                 const localHash = await this.calculateHash(content);
    //                 const storedHash = await this.localDatabase.getContentHash(file.path);

    //                 if (storedHash && localHash !== storedHash) {
    //                     // Content has changed since last sync
    //                     this.logger.info(
    //                         `Found modified local file: ${file.path}, queuing for update`,
    //                     );

    //                     this.uploadQueue.enqueue({
    //                         type: 'modify',
    //                         path: file.path,
    //                         contentHash: localHash,
    //                         timestamp: new Date(),
    //                     });
    //                     modifiedCount++;
    //                 } else {
    //                     this.logger.debug(`File unchanged: ${file.path}`);
    //                 }
    //             } else {
    //                 // Not mapped, queue for upload as new file
    //                 this.logger.info(`Found unmapped local file: ${file.path}, queuing for upload`);

    //                 const content = await this.app.fileManager.read(file);
    //                 const contentHash = await this.calculateHash(content);

    //                 this.uploadQueue.enqueue({
    //                     type: 'create',
    //                     path: file.path,
    //                     contentHash: contentHash,
    //                     timestamp: new Date(),
    //                 });
    //                 uploadCount++;
    //             }
    //         }

    //         this.logger.info(
    //             `Queued ${uploadCount} new files, ${modifiedCount} modified files for upload`,
    //         );
    //         this.logger.info(`Upload queue size: ${this.uploadQueue.size()}`);
    //     } catch (error: any) {
    //         this.logger.error('Error scanning local files:', error);
    //         throw error;
    //     }
    // }

    private async handleLocalChange(event: FileChangeEvent): Promise<void> {
        console.log('[SyncEngine] Local change detected:', event.type, event.path);

        // Add to upload queue with retry logic
        this.uploadQueue.enqueue(event);
    }

    /**
     * Process all items in the upload queue synchronously
     * Used during initial sync to ensure files are uploaded before completing
     *
     * IMPORTANT: We pause the queue's internal processing to prevent race conditions
     * where both processUploadQueue and handleUploadRequest try to process the same item
     */
    private async processUploadQueue(): Promise<void> {
        const items = this.uploadQueue.getPending();
        if (items.length === 0) return;

        // Note: Queue should already be paused by caller (performFullReconciliation)
        // This ensures no timer-based processing interferes

        this.logger.info(`Processing upload queue: ${items.length} items`);
        this.syncLogger.info(`Uploading ${items.length} files...`, undefined, 'Upload');

        for (const item of items) {
            try {
                await this.uploadChange(item);
                this.uploadQueue.markSuccess(item.path);
                this.logger.info(`Uploaded: ${item.path}`);
                this.syncLogger.info(
                    `Uploaded: ${item.path.split('/').pop()}`,
                    item.path,
                    'Upload',
                );
            } catch (error: any) {
                this.logger.error(`Failed to upload ${item.path}:`, error);
                this.syncLogger.error(
                    `Failed: ${item.path.split('/').pop()}`,
                    (error as any)?.message || 'Unknown error',
                    'Upload',
                );
                this.uploadQueue.markFailure(item.path, error as Error);
            }
        }

        // RESUME queue processing for subsequent file changes
        this.uploadQueue.resume();

        // FORCE emit sync-count-change with actual queue size to ensure UI updates
        const finalQueueSize = this.uploadQueue.size();
        this.trigger('sync-count-change', finalQueueSize);

        // Clear localStorage if queue is empty to prevent stale items on next startup
        if (finalQueueSize === 0) {
            this.uploadQueue.clearStorage();
        }

        this.logger.info(`Upload queue processing complete. Remaining: ${finalQueueSize}`);
        this.syncLogger.info('Upload queue complete', undefined, 'Upload');
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
        } catch (error: any) {
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

        // Encrypt content with embedded nonce (self-contained blobs)
        const encryptedTitle = await this.encryptionManager.encryptBlob(title);
        const encryptedContent = await this.encryptionManager.encryptBlob(content);

        // Check if note exists
        const existingNoteId = await this.localDatabase.getNoteIdByPath(path);

        if (existingNoteId) {
            // Update existing note with version check
            const currentVersion = (await this.localDatabase.getNoteVersion(path)) || 0;

            try {
                const updatedNote = await this.noteSyncService.updateNote(existingNoteId, {
                    encrypted_title: encryptedTitle,
                    encrypted_content: encryptedContent,
                    nonce: 'embedded', // Nonce is now embedded in each field
                    encryption_algo: 'AES-256-GCM',
                    content_hash: contentHash,
                    expected_version: currentVersion,
                });

                await this.localDatabase.saveNoteVersion(
                    path,
                    updatedNote.version,
                    existingNoteId,
                    contentHash,
                );
                this.syncLogger.info(`Updated note: ${path} → v${updatedNote.version}`);
            } catch (error: any) {
                // Check if it's a version conflict (409 Conflict)
                if (
                    (error as any)?.message?.includes('409') ||
                    (error as any)?.message?.includes('conflict') ||
                    (error as any)?.message?.includes('version')
                ) {
                    this.syncLogger.warn(`Version conflict for ${path}, resolving...`);

                    // Fetch the latest version from server
                    const remoteNote = await this.noteSyncService.getNote(existingNoteId);

                    // Apply remote update (this will trigger conflict resolution)
                    await this.applyRemoteUpdate(remoteNote);

                    // After conflict resolution, retry the upload
                    // The conflict resolver should have updated the local file
                    const updatedContent = await this.app.fileManager.read(file);
                    const updatedEncrypted =
                        await this.encryptionManager.encryptBlob(updatedContent);
                    const updatedTitleEncrypted = await this.encryptionManager.encryptBlob(title);

                    const retriedNote = await this.noteSyncService.updateNote(existingNoteId, {
                        encrypted_title: updatedTitleEncrypted,
                        encrypted_content: updatedEncrypted,
                        nonce: 'embedded',
                        encryption_algo: 'AES-256-GCM',
                        content_hash: await this.calculateHash(updatedContent),
                        expected_version: remoteNote.version, // Use remote version now
                    });

                    const retriedHash = await this.calculateHash(updatedContent);
                    await this.localDatabase.saveNoteVersion(
                        path,
                        retriedNote.version,
                        existingNoteId,
                        retriedHash,
                    );
                    this.syncLogger.info(`Conflict resolved: ${path} → v${retriedNote.version}`);
                } else {
                    // Not a version conflict, rethrow
                    throw error;
                }
            }
        } else {
            // DEDUPLICATION GUARD: Re-check if note was mapped by concurrent upload
            // This can happen if two uploads for same path race concurrently
            const recheckNoteId = await this.localDatabase.getNoteIdByPath(path);
            if (recheckNoteId) {
                // Another upload already created/mapped this note - upgrade to update
                this.logger.info(
                    `[uploadChange] Path was mapped concurrently, upgrading to update: ${path}`,
                );
                const currentVersion = (await this.localDatabase.getNoteVersion(path)) || 0;
                const updatedNote = await this.noteSyncService.updateNote(recheckNoteId, {
                    encrypted_title: encryptedTitle,
                    encrypted_content: encryptedContent,
                    nonce: 'embedded',
                    encryption_algo: 'AES-256-GCM',
                    content_hash: contentHash,
                    expected_version: currentVersion,
                });
                await this.localDatabase.saveNoteVersion(
                    path,
                    updatedNote.version,
                    recheckNoteId,
                    contentHash,
                );
                this.syncLogger.info(`Updated note (dedup): ${path} → v${updatedNote.version}`);
                return;
            }

            // Create new note
            if (!this.workspaceId) {
                throw new Error('Cannot create note: no workspace ID set');
            }

            this.logger.info(`Creating note with workspace_id: ${this.workspaceId}`);

            const newNote = await this.noteSyncService.createNote({
                workspace_id: this.workspaceId,
                type: 'file',
                encrypted_title: encryptedTitle,
                encrypted_content: encryptedContent,
                nonce: 'embedded', // Nonce is now embedded in each field
                encryption_algo: 'AES-256-GCM',
                content_hash: contentHash,
            });

            await this.mapPathToNote(path, newNote.id);
            await this.localDatabase.saveNoteVersion(
                path,
                newNote.version,
                newNote.id,
                contentHash,
            );
            this.syncLogger.info(`Created note: ${path} (${newNote.id})`);
        }
    }

    private async handleLocalDelete(path: string): Promise<void> {
        const noteId = await this.localDatabase.getNoteIdByPath(path);
        if (noteId) {
            await this.noteSyncService.deleteNote(noteId);
            await this.unmapPath(path);
            this.syncLogger.info(`Deleted note: ${path}`);
        }
    }

    private async handleLocalRename(oldPath: string, newPath: string): Promise<void> {
        this.logger.info(`[handleLocalRename] Processing rename: ${oldPath} → ${newPath}`);

        const noteId = await this.localDatabase.getNoteIdByPath(oldPath);
        if (noteId) {
            // Update mapping
            await this.unmapPath(oldPath);
            await this.mapPathToNote(newPath, noteId);

            // Update note title with embedded nonce
            const newTitle = this.extractTitle(newPath);
            const encryptedTitle = await this.encryptionManager.encryptBlob(newTitle);

            await this.noteSyncService.updateNote(noteId, {
                encrypted_title: encryptedTitle,
                nonce: 'embedded',
            });

            this.syncLogger.info(`Renamed: ${oldPath} → ${newPath}`);
        } else {
            // No mapping found for oldPath - this might mean it's a new file or mapping is broken
            this.logger.warn(`[handleLocalRename] No note mapping found for oldPath: ${oldPath}`);
            // Treat as a new file creation
            const file = this.app.workspace.getAbstractFileByPath(newPath) as any;
            if (file) {
                const content = await this.app.fileManager.read(file);
                const contentHash = await this.calculateHash(content);
                // Enqueue as create since we have no mapping
                this.uploadQueue.enqueue({
                    type: 'create',
                    path: newPath,
                    contentHash,
                    timestamp: new Date(),
                });
                this.syncLogger.info(`Renamed file has no mapping, creating as new: ${newPath}`);
            }
        }
    }

    private async handleRemoteUpdate(payload: any): Promise<void> {
        // Skip if this update came from current device
        const deviceId = this.app.syncManager.deviceManager.getDeviceId();
        console.log(
            '[SyncEngine] handleRemoteUpdate - payload.device_id:',
            payload.device_id,
            'local deviceId:',
            deviceId,
        );
        if (payload.device_id === deviceId) {
            this.syncLogger.debug(`Ignoring own update: ${payload.note_id}`);
            return;
        }

        this.syncLogger.info(`Remote update received: ${payload.note_id}`);

        // Fetch full note
        const note = await this.noteSyncService.getNote(payload.note_id);
        await this.applyRemoteUpdate(note);
    }

    /**
     * Try to decrypt with embedded nonce format, fall back to legacy format if it fails
     */
    private async decryptWithFallback(
        encryptedData: string,
        legacyNonce?: string,
    ): Promise<string> {
        try {
            // Try new format (nonce embedded in blob)
            return await this.encryptionManager.decryptBlob(encryptedData);
        } catch (error: any) {
            this.syncLogger.debug(`decryptBlob failed, trying legacy format. Error: ${error}`);
            // Fall back to legacy format (separate nonce)
            if (legacyNonce && legacyNonce !== 'embedded') {
                this.syncLogger.debug(
                    `Using legacy decryption with nonce: ${legacyNonce.substring(0, 10)}...`,
                );
                return await this.encryptionManager.decrypt({
                    encrypted_content: encryptedData,
                    nonce: legacyNonce,
                    encryption_algo: 'AES-256-GCM',
                });
            }
            this.syncLogger.error(
                `Decryption failed - no valid legacy nonce. legacyNonce=${legacyNonce}`,
            );
            throw error;
        }
    }

    private async applyRemoteUpdate(note: NoteResponse): Promise<void> {
        this.syncLogger.debug(`applyRemoteUpdate called for note ${note.id}`);
        try {
            // Decrypt using embedded nonce format with legacy fallback
            this.syncLogger.debug(`Decrypting title for note ${note.id}...`);
            const title = await this.decryptWithFallback(note.encrypted_title, note.nonce);
            this.syncLogger.debug(`Title decrypted: ${title}`);

            const content = note.encrypted_content
                ? await this.decryptWithFallback(note.encrypted_content, note.nonce)
                : '';
            this.syncLogger.debug(`Content decrypted (${content.length} chars)`);

            // Determine path
            const existingPath = await this.localDatabase.getPathByNoteId(note.id);
            const path = existingPath || this.sanitizePath(title);
            this.syncLogger.debug(`Path determined: ${path} (existing: ${existingPath || 'none'})`);

            // Check for local conflict
            const localExists = await this.app.fileSystemManager.exists(path);
            this.syncLogger.debug(`Local file exists: ${localExists}`);
            if (localExists) {
                const file = this.app.workspace.getAbstractFileByPath(path) as any;
                if (!file) return;

                const localContent = await this.app.fileManager.read(file);
                const localHash = await this.calculateHash(localContent);
                
                // Get the hash we had at last sync (what we uploaded/downloaded)
                const lastSyncedHash = await this.localDatabase.getContentHash(path);
                
                // Determine what changed since last sync
                const localChanged = lastSyncedHash && localHash !== lastSyncedHash;
                const serverChanged = lastSyncedHash && note.content_hash !== lastSyncedHash;
                
                if (localHash === note.content_hash) {
                    // Same content - just update version tracking
                    await this.localDatabase.saveNoteVersion(
                        path,
                        note.version,
                        note.id,
                        note.content_hash,
                    );
                    this.syncLogger.debug(`Synced (same content): ${path} v${note.version}`);
                    return;
                }
                
                if (localChanged && serverChanged) {
                    // TRUE CONFLICT: Both sides changed since last sync
                    this.syncLogger.warn(`True conflict detected: ${path} (both sides changed since last sync)`);

                    // Register conflict in logger for UI
                    this.syncLogger.addConflict({
                        noteId: note.id,
                        path,
                        localVersion: (await this.localDatabase.getNoteVersion(path)) || 0,
                        serverVersion: note.version,
                        localContent,
                        serverContent: content,
                        localHash,
                        serverHash: note.content_hash,
                    });

                    const resolution = await this.conflictResolver.resolve(
                        path,
                        localContent,
                        content,
                        note,
                    );
                    
                    if (resolution.type === 'needs-user-decision') {
                        // Hard conflict - leave for user to resolve in SyncModal
                        // Don't modify the file, don't mark conflict as resolved
                        this.syncLogger.warn(
                            `Hard conflict for ${path} - user must resolve manually`,
                            'Check Sync Status for conflict resolution options',
                        );
                        // Keep the conflict in the list (don't resolve it)
                        // Don't update tracking - user needs to decide first
                        return;
                    }
                    
                    // Auto-merge succeeded - apply the merged content
                    this.fileWatcher.pause();
                    try {
                        await this.app.fileManager.modify(file, resolution.content);
                    } finally {
                        this.fileWatcher.resume();
                    }
                    
                    // Mark conflict as resolved since auto-merge worked
                    const addedConflict = this.syncLogger.getConflicts().find(c => c.path === path && !c.resolved);
                    if (addedConflict) {
                        this.syncLogger.resolveConflict(addedConflict.id, 'merged');
                    }
                    
                    this.syncLogger.info(`Conflict auto-resolved for ${path} using ${resolution.strategy}`);
                } else if (serverChanged && !localChanged) {
                    // Only server changed - accept server version (normal pull)
                    this.syncLogger.info(`Server updated: ${path}, applying remote changes`);
                    this.fileWatcher.pause();
                    try {
                        await this.app.fileManager.modify(file, content);
                    } finally {
                        this.fileWatcher.resume();
                    }
                } else if (localChanged && !serverChanged) {
                    // Only local changed - this is a normal edit, will be uploaded by file watcher
                    this.syncLogger.debug(`Local edit detected: ${path}, skipping server version (local is newer)`);
                    // Don't overwrite local - it will be uploaded by file watcher or next sync
                    return;
                } else {
                    // No lastSyncedHash - first sync of this file after mapping, use server version
                    this.syncLogger.info(`First sync for ${path}, using server version`);
                    this.fileWatcher.pause();
                    try {
                        await this.app.fileManager.modify(file, content);
                    } finally {
                        this.fileWatcher.resume();
                    }
                }
            } else {
                // New file, create locally
                this.syncLogger.info(`Creating new local file: ${path}`);
                // Pause file watcher to prevent detecting our own changes
                this.fileWatcher.pause();
                try {
                    await this.app.fileManager.createFile(path, content);
                    this.syncLogger.info(`Created local file: ${path}`);
                } catch (createError) {
                    this.syncLogger.error(`Failed to create file ${path}: ${createError}`);
                    throw createError;
                } finally {
                    this.fileWatcher.resume();
                }
            }

            // Update tracking
            await this.mapPathToNote(path, note.id);
            await this.localDatabase.saveNoteVersion(
                path,
                note.version,
                note.id,
                note.content_hash,
            );
            this.syncLogger.info(`Applied remote update: ${path} v${note.version}`);
            this.trigger('sync-remote-update', path);
        } catch (error: any) {
            this.syncLogger.error(`Failed to apply remote update for note ${note.id}: ${error}`);
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
        return (path.split('/').pop() || '').replace(/\.md$/, '');
    }

    private sanitizePath(title: string): string {
        const sanitizedName = `${title.replace(/[/\\?%*:|"<>]/g, '-')}.md`;
        const workspaceRoot = this.app.workspace.getRoot();
        if (workspaceRoot) {
            // Join workspace root with sanitized filename
            return `${workspaceRoot}/${sanitizedName}`;
        }
        return sanitizedName;
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

    // private async getLastSyncTime(): Promise<Date> {
    //     const config = await this.app.configManager.loadConfig<any>('sync');
    //     return config?.lastSyncTime ? new Date(config.lastSyncTime) : new Date(0);
    // }

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
        } catch (error: any) {
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

    /**
     * Force upload a local file, ignoring version conflicts
     * Used for conflict resolution when user chooses local version
     */
    async forceUpload(path: string): Promise<void> {
        this.syncLogger.info(`Force uploading: ${path}`);

        const file = this.app.workspace.getAbstractFileByPath(path) as any;
        if (!file) {
            throw new Error(`File not found: ${path}`);
        }

        const content = await this.app.fileManager.read(file);
        const title = this.extractTitle(path);
        const contentHash = await this.calculateHash(content);

        const encryptedTitle = await this.encryptionManager.encryptBlob(title);
        const encryptedContent = await this.encryptionManager.encryptBlob(content);

        const noteId = await this.localDatabase.getNoteIdByPath(path);

        if (noteId) {
            // Get current server version to use as expected_version
            const serverNote = await this.noteSyncService.getNote(noteId);

            const updatedNote = await this.noteSyncService.updateNote(noteId, {
                encrypted_title: encryptedTitle,
                encrypted_content: encryptedContent,
                nonce: 'embedded',
                encryption_algo: 'AES-256-GCM',
                content_hash: contentHash,
                expected_version: serverNote.version,
            });

            await this.localDatabase.saveNoteVersion(
                path,
                updatedNote.version,
                noteId,
                contentHash,
            );
            this.syncLogger.info(`Force uploaded: ${path} → v${updatedNote.version}`);
        } else {
            // Create new note if no mapping exists
            if (!this.workspaceId) {
                throw new Error('Cannot create note: no workspace ID set');
            }
            const newNote = await this.noteSyncService.createNote({
                workspace_id: this.workspaceId,
                type: 'file',
                encrypted_title: encryptedTitle,
                encrypted_content: encryptedContent,
                nonce: 'embedded',
                encryption_algo: 'AES-256-GCM',
                content_hash: contentHash,
            });

            await this.mapPathToNote(path, newNote.id);
            await this.localDatabase.saveNoteVersion(
                path,
                newNote.version,
                newNote.id,
                contentHash,
            );
            this.syncLogger.info(`Force created: ${path} → v${newNote.version}`);
        }
    }

    /**
     * Force download a server note, overwriting local file
     * Used for conflict resolution when user chooses server version
     */
    async forceDownload(noteId: string, path: string): Promise<void> {
        this.syncLogger.info(`Force downloading to: ${path}`);

        const note = await this.noteSyncService.getNote(noteId);

        // Decrypt content

        const content = note.encrypted_content
            ? await this.decryptWithFallback(note.encrypted_content, note.nonce)
            : '';

        // Write to local file (pause watcher to avoid re-triggering)
        this.fileWatcher.pause();
        try {
            const file = this.app.workspace.getAbstractFileByPath(path) as any;
            if (file) {
                await this.app.fileManager.modify(file, content);
            } else {
                await this.app.fileManager.createFile(path, content);
            }
        } finally {
            this.fileWatcher.resume();
        }

        // Update local tracking
        await this.mapPathToNote(path, noteId);
        await this.localDatabase.saveNoteVersion(path, note.version, noteId, note.content_hash);

        this.syncLogger.info(`Force downloaded: ${path} ← v${note.version}`);
    }

    // ============================================
    // Periodic Scan & Verification
    // ============================================

    private scanInterval: NodeJS.Timeout | null = null;
    private readonly SCAN_INTERVAL_MS = 60000; // 1 minute

    /**
     * Start periodic background scan for undetected changes
     * This catches changes that FileWatcher might have missed
     */
    startPeriodicScan(): void {
        if (this.scanInterval) return;

        this.syncLogger.debug(`Starting periodic scan (interval: ${this.SCAN_INTERVAL_MS}ms)`);
        this.scanInterval = setInterval(async () => {
            try {
                await this.scanForUndetectedChanges();
            } catch (error: any) {
                this.syncLogger.error('Periodic scan failed', error as any);
            }
        }, this.SCAN_INTERVAL_MS);
    }

    /**
     * Stop periodic background scan
     */
    stopPeriodicScan(): void {
        if (this.scanInterval) {
            clearInterval(this.scanInterval);
            this.scanInterval = null;
            this.logger.info('Periodic scan stopped');
        }
    }

    /**
     * Scan for changes that FileWatcher might have missed
     * This is a lighter-weight check than full reconciliation
     */
    async scanForUndetectedChanges(): Promise<number> {
        this.logger.debug('Scanning for undetected changes...');
        let changesFound = 0;

        try {
            const files = await this.app.workspace.getFiles(['md']);

            for (const file of files) {
                if (this.selectiveSync.shouldIgnore(file.path)) continue;

                const content = await this.app.fileManager.read(file);
                const currentHash = await this.calculateHash(content);
                const storedHash = await this.localDatabase.getContentHash(file.path);

                if (storedHash && currentHash !== storedHash) {
                    this.logger.info(`Detected untracked change: ${file.path}`);

                    // Queue for upload
                    this.uploadQueue.enqueue({
                        type: 'modify',
                        path: file.path,
                        contentHash: currentHash,
                        timestamp: new Date(),
                    });
                    changesFound++;
                } else if (!storedHash) {
                    // File exists but has no stored hash - might be new
                    const noteId = await this.localDatabase.getNoteIdByPath(file.path);
                    if (!noteId) {
                        this.logger.info(`Found new unmapped file: ${file.path}`);
                        this.uploadQueue.enqueue({
                            type: 'create',
                            path: file.path,
                            contentHash: currentHash,
                            timestamp: new Date(),
                        });
                        changesFound++;
                    }
                }
            }

            if (changesFound > 0) {
                this.logger.info(`Scan found ${changesFound} undetected changes`);
            } else {
                this.logger.debug('No undetected changes found');
            }
        } catch (error: any) {
            this.logger.error('Error scanning for changes:', error);
        }

        return changesFound;
    }

    /**
     * Verify current sync status by comparing local state with server manifest
     * Returns detailed sync status including synced, pending, and conflict counts
     */
    async verifySyncStatus(): Promise<SyncVerificationResult> {
        this.logger.info('Verifying sync status...');

        let synced = 0;
        let pending = 0;
        let conflicts = 0;
        let total = 0;

        try {
            // Get server manifest
            const manifest = await this.noteSyncService.getManifest();
            const manifestNotes = manifest?.notes || [];
            const serverMap = new Map(manifestNotes.map((n) => [n.id, n]));

            // Get local files
            const localFiles = await this.app.workspace.getFiles(['md']);

            for (const file of localFiles) {
                if (this.selectiveSync.shouldIgnore(file.path)) continue;
                total++;

                const content = await this.app.fileManager.read(file);
                const localHash = await this.calculateHash(content);
                const noteId = await this.localDatabase.getNoteIdByPath(file.path);

                if (noteId) {
                    const serverEntry = serverMap.get(noteId);
                    if (!serverEntry) {
                        // Deleted on server
                        pending++;
                    } else if (localHash === serverEntry.content_hash) {
                        // Perfectly synced
                        synced++;
                    } else {
                        // Content differs
                        const storedVersion =
                            (await this.localDatabase.getNoteVersion(file.path)) || 0;
                        if (storedVersion === serverEntry.version) {
                            // Same version but different hash = conflict
                            conflicts++;
                        } else {
                            // Different version = needs sync
                            pending++;
                        }
                    }
                } else {
                    // Not yet uploaded
                    pending++;
                }
            }

            // Check for server notes not present locally
            const localNoteIds = new Set<string>();
            for (const file of localFiles) {
                const noteId = await this.localDatabase.getNoteIdByPath(file.path);
                if (noteId) localNoteIds.add(noteId);
            }

            for (const [noteId, entry] of serverMap) {
                if (!localNoteIds.has(noteId) && !entry.is_deleted) {
                    pending++;
                    total++;
                }
            }
        } catch (error: any) {
            this.logger.error('Error verifying sync status:', error);
        }

        const result: SyncVerificationResult = {
            synced,
            pending,
            conflicts,
            total,
            lastCheck: new Date(),
        };

        this.logger.info(
            `Sync status: ${synced}/${total} synced, ${pending} pending, ${conflicts} conflicts`,
        );
        this.trigger('sync-status-verified', result);

        return result;
    }
}
