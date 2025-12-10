import { Events } from '../Events';
import type { SyncEngine } from './SyncEngine';
import type { SyncConflict as LoggerConflict, SyncLogger } from './SyncLogger';

/**
 * Sync status states
 */
export type SyncStatus =
    | 'idle' // No sync activity
    | 'checking' // Checking for changes
    | 'syncing' // Active sync in progress
    | 'uploading' // Uploading local changes
    | 'downloading' // Downloading remote changes
    | 'offline' // No network connection
    | 'error' // Sync error
    | 'conflict'; // Has unresolved conflicts

/**
 * Sync progress information
 */
export interface SyncProgress {
    current: number;
    total: number;
    currentFile?: string;
    operation: 'upload' | 'download' | 'check';
}

/**
 * Sync conflict with user-friendly information
 * Extends the SyncLogger conflict type with additional UI fields
 */
export interface SyncConflict extends LoggerConflict {
    // Additional UI fields
    localPreview?: string; // First 200 chars of local content
    serverPreview?: string; // First 200 chars of server content
}

/**
 * Complete sync state
 */
export interface SyncState {
    status: SyncStatus;
    lastSync: Date | null;
    pendingUploads: number;
    pendingDownloads: number;
    conflicts: SyncConflict[];
    progress?: SyncProgress;
    error?: string;
}

/**
 * SyncOrchestrator - Centralized sync state and operations management
 *
 * Provides a clean, event-driven API for sync operations.
 * Delegates actual sync work to SyncEngine but manages state.
 *
 * Events:
 * - 'state-change': SyncState changed
 * - 'sync-start': Sync starting
 * - 'sync-complete': Sync completed successfully
 * - 'sync-error': Sync failed with error
 * - 'conflict-detected': New conflict detected
 * - 'progress': Progress update during sync
 */
export class SyncOrchestrator extends Events {
    private syncEngine: SyncEngine | null = null;
    private syncLogger: SyncLogger | null = null;

    private state: SyncState = {
        status: 'idle',
        lastSync: null,
        pendingUploads: 0,
        pendingDownloads: 0,
        conflicts: [],
    };

    /**
     * Initialize with SyncEngine instance
     */
    initialize(syncEngine: SyncEngine, syncLogger: SyncLogger): void {
        this.syncEngine = syncEngine;
        this.syncLogger = syncLogger;

        // Subscribe to SyncEngine events
        this.setupEngineListeners();

        // Load conflicts from logger
        this.loadConflicts();
    }

    /**
     * Get current sync state (immutable copy)
     */
    getState(): Readonly<SyncState> {
        return { ...this.state };
    }

    /**
     * Check if sync is currently active
     */
    isSyncing(): boolean {
        return ['syncing', 'uploading', 'downloading', 'checking'].includes(this.state.status);
    }

    /**
     * Trigger a full sync (pull + push)
     */
    async startSync(): Promise<void> {
        if (!this.syncEngine) {
            throw new Error('SyncOrchestrator not initialized');
        }

        if (this.isSyncing()) {
            console.log('[SyncOrchestrator] Sync already in progress');
            return;
        }

        this.updateState({ status: 'syncing', error: undefined });
        this.trigger('sync-start');

        try {
            await this.syncEngine.sync();
            this.updateState({
                status: this.state.conflicts.length > 0 ? 'conflict' : 'idle',
                lastSync: new Date(),
            });
            this.trigger('sync-complete');
        } catch (error: any) {
            this.updateState({
                status: 'error',
                error: (error as any)?.message || 'Sync failed',
            });
            this.trigger('sync-error', error);
            throw error;
        }
    }

    /**
     * Push only local changes (no pull)
     */
    async pushChanges(): Promise<void> {
        if (!this.syncEngine) {
            throw new Error('SyncOrchestrator not initialized');
        }

        if (this.isSyncing()) {
            console.log('[SyncOrchestrator] Sync already in progress');
            return;
        }

        this.updateState({ status: 'uploading' });

        try {
            // Process pending uploads from queue
            const pending = this.syncEngine.getPendingChanges();
            if (pending > 0) {
                await this.syncEngine.sync();
            }
            this.updateState({
                status: this.state.conflicts.length > 0 ? 'conflict' : 'idle',
                lastSync: new Date(),
            });
        } catch (error: any) {
            this.updateState({ status: 'error', error: (error as any)?.message });
            throw error;
        }
    }

    /**
     * Resolve a conflict
     * @param conflictId - ID of the conflict to resolve
     * @param resolution - 'local' keeps local version, 'server' keeps server version
     */
    async resolveConflict(conflictId: string, resolution: 'local' | 'server'): Promise<void> {
        if (!this.syncEngine || !this.syncLogger) {
            throw new Error('SyncOrchestrator not initialized');
        }

        const conflict = this.state.conflicts.find((c) => c.id === conflictId);
        if (!conflict) {
            throw new Error(`Conflict not found: ${conflictId}`);
        }

        try {
            if (resolution === 'local') {
                await this.syncEngine.forceUpload(conflict.path);
            } else {
                await this.syncEngine.forceDownload(conflict.noteId, conflict.path);
            }

            // Remove from logger - just pass the id
            this.syncLogger.resolveConflict(conflictId, resolution);

            // Update state
            const updatedConflicts = this.state.conflicts.filter((c) => c.id !== conflictId);
            this.updateState({
                conflicts: updatedConflicts,
                status: updatedConflicts.length > 0 ? 'conflict' : 'idle',
            });
        } catch (error: any) {
            console.error('[SyncOrchestrator] Failed to resolve conflict:', error);
            throw error;
        }
    }

    /**
     * Resolve all conflicts with same strategy
     */
    async resolveAllConflicts(resolution: 'local' | 'server'): Promise<void> {
        for (const conflict of [...this.state.conflicts]) {
            try {
                await this.resolveConflict(conflict.id, resolution);
            } catch (error: any) {
                console.error(`Failed to resolve conflict ${conflict.id}:`, error);
                // Continue with other conflicts
            }
        }
    }

    /**
     * Check if there are any unresolved conflicts
     */
    hasConflicts(): boolean {
        return this.state.conflicts.length > 0;
    }

    /**
     * Get pending upload count
     */
    getPendingUploads(): number {
        return this.syncEngine?.getPendingChanges() ?? 0;
    }

    /**
     * Set status to offline (network unavailable)
     */
    setOffline(): void {
        this.updateState({ status: 'offline' });
    }

    /**
     * Set status to online (network available)
     */
    setOnline(): void {
        if (this.state.status === 'offline') {
            this.updateState({ status: 'idle' });
        }
    }

    /**
     * Update state and emit event
     */
    private updateState(partial: Partial<SyncState>): void {
        this.state = { ...this.state, ...partial };
        this.trigger('state-change', this.getState());
    }

    /**
     * Setup listeners for SyncEngine events
     */
    private setupEngineListeners(): void {
        if (!this.syncEngine) return;

        // Progress events from engine
        this.syncEngine.on('sync-progress', (progress: SyncProgress) => {
            this.updateState({ progress });
            this.trigger('progress', progress);
        });

        // Sync lifecycle events
        this.syncEngine.on('sync-start', () => {
            this.updateState({ status: 'syncing' });
        });

        this.syncEngine.on('sync-complete', () => {
            this.updateState({
                status: this.state.conflicts.length > 0 ? 'conflict' : 'idle',
                lastSync: new Date(),
                progress: undefined,
            });
        });

        this.syncEngine.on('sync-error', (error: Error) => {
            this.updateState({
                status: 'error',
                error: (error as any).message,
                progress: undefined,
            });
        });

        // Upload/download tracking
        this.syncEngine.on('upload-queued', () => {
            this.updateState({
                pendingUploads: this.getPendingUploads(),
            });
        });

        this.syncEngine.on('upload-complete', () => {
            this.updateState({
                pendingUploads: this.getPendingUploads(),
            });
        });
    }

    /**
     * Load existing conflicts from SyncLogger
     */
    private loadConflicts(): void {
        if (!this.syncLogger) return;

        const loggerConflicts = this.syncLogger.getConflicts();
        const conflicts: SyncConflict[] = loggerConflicts.map((c) => this.mapConflict(c));

        this.updateState({
            conflicts,
            status: conflicts.length > 0 ? 'conflict' : this.state.status,
        });
    }

    /**
     * Map raw conflict from logger to orchestrator format
     */
    private mapConflict(raw: LoggerConflict): SyncConflict {
        return {
            ...raw,
            localPreview: raw.localContent?.substring(0, 200),
            serverPreview: raw.serverContent?.substring(0, 200),
        };
    }
}
