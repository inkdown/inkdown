import { Events } from '../Events';

export type SyncLogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface SyncLogEntry {
    id: string;
    timestamp: Date;
    level: SyncLogLevel;
    message: string;
    details?: string;
    module?: string;
}

export interface SyncConflict {
    id: string;
    noteId: string;
    path: string;
    localContent: string;
    serverContent: string;
    localVersion: number;
    serverVersion: number;
    localHash: string;
    serverHash: string;
    createdAt: Date;
    resolved: boolean;
}

/**
 * SyncLogger - Centralized logging for sync operations
 * Emits events that UI can subscribe to for real-time updates
 */
export class SyncLogger extends Events {
    private logs: SyncLogEntry[] = [];
    private conflicts: Map<string, SyncConflict> = new Map();
    private maxLogs = 500;
    private idCounter = 0;

    constructor() {
        super();
    }

    /**
     * Add a log entry
     */
    log(level: SyncLogLevel, message: string, details?: string, module?: string): void {
        const entry: SyncLogEntry = {
            id: `log-${++this.idCounter}`,
            timestamp: new Date(),
            level,
            message,
            details,
            module,
        };

        this.logs.push(entry);

        // Trim old logs
        if (this.logs.length > this.maxLogs) {
            this.logs = this.logs.slice(-this.maxLogs);
        }

        // Emit event for UI
        this.trigger('log', entry);
    }

    debug(message: string, details?: string, module?: string): void {
        this.log('debug', message, details, module);
    }

    info(message: string, details?: string, module?: string): void {
        this.log('info', message, details, module);
    }

    warn(message: string, details?: string, module?: string): void {
        this.log('warn', message, details, module);
    }

    error(message: string, details?: string, module?: string): void {
        this.log('error', message, details, module);
    }

    /**
     * Get all logs (or filtered by level)
     */
    getLogs(minLevel?: SyncLogLevel): SyncLogEntry[] {
        if (!minLevel) return [...this.logs];

        const levels: SyncLogLevel[] = ['debug', 'info', 'warn', 'error'];
        const minIndex = levels.indexOf(minLevel);

        return this.logs.filter(log => levels.indexOf(log.level) >= minIndex);
    }

    /**
     * Clear all logs
     */
    clearLogs(): void {
        this.logs = [];
        this.trigger('logs-cleared');
    }

    /**
     * Register a conflict for user resolution
     */
    addConflict(conflict: Omit<SyncConflict, 'id' | 'createdAt' | 'resolved'>): SyncConflict {
        const fullConflict: SyncConflict = {
            ...conflict,
            id: `conflict-${++this.idCounter}`,
            createdAt: new Date(),
            resolved: false,
        };

        this.conflicts.set(fullConflict.id, fullConflict);
        this.trigger('conflict-added', fullConflict);
        this.log('warn', `Conflict detected: ${conflict.path}`, `Local v${conflict.localVersion} vs Server v${conflict.serverVersion}`, 'Conflict');

        return fullConflict;
    }

    /**
     * Mark conflict as resolved
     */
    resolveConflict(conflictId: string, resolution: 'local' | 'server' | 'merged'): void {
        const conflict = this.conflicts.get(conflictId);
        if (conflict) {
            conflict.resolved = true;
            this.trigger('conflict-resolved', { conflict, resolution });
            this.log('info', `Conflict resolved: ${conflict.path}`, `Resolution: ${resolution}`, 'Conflict');
        }
    }

    /**
     * Get all unresolved conflicts
     */
    getConflicts(): SyncConflict[] {
        return Array.from(this.conflicts.values()).filter(c => !c.resolved);
    }

    /**
     * Get conflict by ID
     */
    getConflict(id: string): SyncConflict | undefined {
        return this.conflicts.get(id);
    }

    /**
     * Clear resolved conflicts
     */
    clearResolvedConflicts(): void {
        for (const [id, conflict] of this.conflicts) {
            if (conflict.resolved) {
                this.conflicts.delete(id);
            }
        }
    }

    /**
     * Clear all conflicts
     */
    clearAllConflicts(): void {
        this.conflicts.clear();
        this.trigger('conflicts-cleared');
    }
}

// Singleton instance
let syncLoggerInstance: SyncLogger | null = null;

export function getSyncLogger(): SyncLogger {
    if (!syncLoggerInstance) {
        syncLoggerInstance = new SyncLogger();
    }
    return syncLoggerInstance;
}
