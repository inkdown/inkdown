import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useApp } from '../contexts/AppContext';
import {
    X,
    RefreshCw,
    AlertTriangle,
    Check,
    ChevronDown,
    ChevronRight,
    Trash2,
    Copy,
    GitMerge,
    FileText,
    Cloud,
    HardDrive
} from 'lucide-react';
import type { SyncLogEntry, SyncConflict, SyncLogLevel } from '@inkdown/core';
import { getSyncLogger } from '@inkdown/core';
import { SyncProgress, SyncProgressOperation } from './SyncProgress';
import './SyncModal.css';

interface SyncModalProps {
    isOpen: boolean;
    onClose: () => void;
}

type Tab = 'logs' | 'conflicts';

// Progress state type
interface ProgressState {
    operation: SyncProgressOperation;
    current: number;
    total: number;
    currentFile?: string;
}

export const SyncModal: React.FC<SyncModalProps> = ({ isOpen, onClose }) => {
    const app = useApp();
    const [activeTab, setActiveTab] = useState<Tab>('logs');
    const [logs, setLogs] = useState<SyncLogEntry[]>([]);
    const [conflicts, setConflicts] = useState<SyncConflict[]>([]);
    const [logLevel, setLogLevel] = useState<SyncLogLevel>('info');
    const [autoScroll, setAutoScroll] = useState(true);
    const [selectedConflict, setSelectedConflict] = useState<SyncConflict | null>(null);
    const [isSyncing, setIsSyncing] = useState(false);
    const [progress, setProgress] = useState<ProgressState>({
        operation: 'idle',
        current: 0,
        total: 0,
    });
    const logsEndRef = useRef<HTMLDivElement>(null);
    const syncLogger = getSyncLogger();

    // Load initial data
    useEffect(() => {
        if (isOpen) {
            setLogs(syncLogger.getLogs(logLevel));
            setConflicts(syncLogger.getConflicts());
        }
    }, [isOpen, logLevel]);

    // Subscribe to log events
    useEffect(() => {
        if (!isOpen) return;

        const handleLog = (entry: SyncLogEntry) => {
            setLogs(prev => [...prev.slice(-499), entry]);
        };

        const handleConflictAdded = (conflict: SyncConflict) => {
            setConflicts(prev => [...prev, conflict]);
            // Auto-switch to conflicts tab when new conflict arrives
            setActiveTab('conflicts');
        };

        const handleConflictResolved = () => {
            setConflicts(syncLogger.getConflicts());
        };

        const handleLogsCleared = () => {
            setLogs([]);
        };

        const refs = [
            syncLogger.on('log', handleLog),
            syncLogger.on('conflict-added', handleConflictAdded),
            syncLogger.on('conflict-resolved', handleConflictResolved),
            syncLogger.on('logs-cleared', handleLogsCleared),
        ];

        return () => {
            refs.forEach(ref => ref.unload());
        };
    }, [isOpen]);

    // Auto-scroll logs
    useEffect(() => {
        if (autoScroll && logsEndRef.current) {
            logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [logs, autoScroll]);

    // Handle sync now
    const handleSyncNow = useCallback(async () => {
        setIsSyncing(true);
        setProgress({ operation: 'check', current: 0, total: 0 });
        try {
            await app.syncManager.syncNow();
            setProgress({ operation: 'complete', current: 0, total: 0 });
            // Reset to idle after a short delay
            setTimeout(() => {
                setProgress({ operation: 'idle', current: 0, total: 0 });
            }, 2000);
        } catch (error) {
            console.error('Sync failed:', error);
            setProgress({ operation: 'idle', current: 0, total: 0 });
        } finally {
            setIsSyncing(false);
        }
    }, [app.syncManager]);

    // Handle conflict resolution
    const handleResolveConflict = async (conflict: SyncConflict, resolution: 'local' | 'server') => {
        try {
            syncLogger.info(`Resolving conflict for ${conflict.path}...`, `Using ${resolution} version`, 'Conflict');

            const syncEngine = app.syncManager.syncEngine;
            if (!syncEngine) {
                throw new Error('Sync engine not available');
            }

            if (resolution === 'local') {
                // Keep local version - force upload
                await syncEngine.forceUpload(conflict.path);
            } else {
                // Use server version - download and overwrite
                await syncEngine.forceDownload(conflict.noteId, conflict.path);
            }

            syncLogger.resolveConflict(conflict.id, resolution);
            setSelectedConflict(null);
            setConflicts(syncLogger.getConflicts());
        } catch (error: any) {
            syncLogger.error(`Failed to resolve conflict: ${error.message}`, undefined, 'Conflict');
        }
    };

    // Clear logs
    const handleClearLogs = () => {
        syncLogger.clearLogs();
        setLogs([]);
    };

    // Copy logs to clipboard
    const handleCopyLogs = () => {
        const logText = logs
            .map(log => `[${log.timestamp.toISOString()}] [${log.level.toUpperCase()}] ${log.module ? `[${log.module}] ` : ''}${log.message}${log.details ? ` - ${log.details}` : ''}`)
            .join('\n');
        navigator.clipboard.writeText(logText);
    };

    if (!isOpen) return null;

    const filteredLogs = logs.filter(log => {
        const levels: SyncLogLevel[] = ['debug', 'info', 'warn', 'error'];
        return levels.indexOf(log.level) >= levels.indexOf(logLevel);
    });

    return (
        <div className="sync-modal-overlay" onClick={onClose}>
            <div className="sync-modal" onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="sync-modal-header">
                    <h2>Sync Status</h2>
                    <div className="sync-modal-actions">
                        <button
                            className="sync-btn primary"
                            onClick={handleSyncNow}
                            disabled={isSyncing}
                        >
                            <RefreshCw size={14} className={isSyncing ? 'spin' : ''} />
                            {isSyncing ? 'Syncing...' : 'Sync Now'}
                        </button>
                        <button className="sync-btn icon" onClick={onClose}>
                            <X size={18} />
                        </button>
                    </div>
                </div>

                {/* Progress indicator */}
                {progress.operation !== 'idle' && (
                    <div className="sync-modal-progress">
                        <SyncProgress
                            operation={progress.operation}
                            current={progress.current}
                            total={progress.total}
                            currentFile={progress.currentFile}
                            isActive={isSyncing}
                        />
                    </div>
                )}

                {/* Tabs */}
                <div className="sync-modal-tabs">
                    <button
                        className={`sync-tab ${activeTab === 'logs' ? 'active' : ''}`}
                        onClick={() => setActiveTab('logs')}
                    >
                        <FileText size={14} />
                        Logs
                        <span className="tab-count">{filteredLogs.length}</span>
                    </button>
                    <button
                        className={`sync-tab ${activeTab === 'conflicts' ? 'active' : ''}`}
                        onClick={() => setActiveTab('conflicts')}
                    >
                        <AlertTriangle size={14} />
                        Conflicts
                        {conflicts.length > 0 && (
                            <span className="tab-count warning">{conflicts.length}</span>
                        )}
                    </button>
                </div>

                {/* Content */}
                <div className="sync-modal-content">
                    {activeTab === 'logs' ? (
                        <LogsView
                            logs={filteredLogs}
                            logLevel={logLevel}
                            setLogLevel={setLogLevel}
                            autoScroll={autoScroll}
                            setAutoScroll={setAutoScroll}
                            onClear={handleClearLogs}
                            onCopy={handleCopyLogs}
                            logsEndRef={logsEndRef}
                        />
                    ) : (
                        <ConflictsView
                            conflicts={conflicts}
                            selectedConflict={selectedConflict}
                            setSelectedConflict={setSelectedConflict}
                            onResolve={handleResolveConflict}
                        />
                    )}
                </div>
            </div>
        </div>
    );
};

// Logs View Component
interface LogsViewProps {
    logs: SyncLogEntry[];
    logLevel: SyncLogLevel;
    setLogLevel: (level: SyncLogLevel) => void;
    autoScroll: boolean;
    setAutoScroll: (auto: boolean) => void;
    onClear: () => void;
    onCopy: () => void;
    logsEndRef: React.RefObject<HTMLDivElement | null>;
}

const LogsView: React.FC<LogsViewProps> = ({
    logs,
    logLevel,
    setLogLevel,
    autoScroll,
    setAutoScroll,
    onClear,
    onCopy,
    logsEndRef,
}) => {
    return (
        <div className="logs-view">
            {/* Toolbar */}
            <div className="logs-toolbar">
                <select
                    value={logLevel}
                    onChange={e => setLogLevel(e.target.value as SyncLogLevel)}
                    className="log-level-select"
                >
                    <option value="debug">Debug</option>
                    <option value="info">Info</option>
                    <option value="warn">Warnings</option>
                    <option value="error">Errors</option>
                </select>
                <label className="auto-scroll-toggle">
                    <input
                        type="checkbox"
                        checked={autoScroll}
                        onChange={e => setAutoScroll(e.target.checked)}
                    />
                    Auto-scroll
                </label>
                <div className="toolbar-spacer" />
                <button className="sync-btn small" onClick={onCopy} title="Copy logs">
                    <Copy size={12} />
                </button>
                <button className="sync-btn small" onClick={onClear} title="Clear logs">
                    <Trash2 size={12} />
                </button>
            </div>

            {/* Log entries */}
            <div className="logs-container">
                {logs.length === 0 ? (
                    <div className="logs-empty">No logs yet. Sync activity will appear here.</div>
                ) : (
                    logs.map(log => (
                        <LogEntry key={log.id} log={log} />
                    ))
                )}
                <div ref={logsEndRef} />
            </div>
        </div>
    );
};

// Single log entry component
const LogEntry: React.FC<{ log: SyncLogEntry }> = ({ log }) => {
    const [expanded, setExpanded] = useState(false);

    return (
        <div className={`log-entry ${log.level}`}>
            <span className="log-time">
                {log.timestamp.toLocaleTimeString()}
            </span>
            <span className={`log-level-badge ${log.level}`}>
                {log.level.toUpperCase()}
            </span>
            {log.module && (
                <span className="log-module">[{log.module}]</span>
            )}
            <span className="log-message">{log.message}</span>
            {log.details && (
                <>
                    <button
                        className="log-expand"
                        onClick={() => setExpanded(!expanded)}
                    >
                        {expanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                    </button>
                    {expanded && (
                        <div className="log-details">{log.details}</div>
                    )}
                </>
            )}
        </div>
    );
};

// Conflicts View Component
interface ConflictsViewProps {
    conflicts: SyncConflict[];
    selectedConflict: SyncConflict | null;
    setSelectedConflict: (conflict: SyncConflict | null) => void;
    onResolve: (conflict: SyncConflict, resolution: 'local' | 'server') => void;
}

const ConflictsView: React.FC<ConflictsViewProps> = ({
    conflicts,
    selectedConflict,
    setSelectedConflict,
    onResolve,
}) => {
    if (conflicts.length === 0) {
        return (
            <div className="conflicts-empty">
                <Check size={48} className="success-icon" />
                <h3>No Conflicts</h3>
                <p>All your notes are in sync!</p>
            </div>
        );
    }

    if (selectedConflict) {
        return (
            <ConflictResolver
                conflict={selectedConflict}
                onBack={() => setSelectedConflict(null)}
                onResolve={onResolve}
            />
        );
    }

    return (
        <div className="conflicts-list">
            <div className="conflicts-header">
                <AlertTriangle size={16} className="warning-icon" />
                <span>{conflicts.length} conflict{conflicts.length > 1 ? 's' : ''} need your attention</span>
            </div>
            {conflicts.map(conflict => (
                <div
                    key={conflict.id}
                    className="conflict-item"
                    onClick={() => setSelectedConflict(conflict)}
                >
                    <div className="conflict-icon">
                        <GitMerge size={18} />
                    </div>
                    <div className="conflict-info">
                        <div className="conflict-path">{conflict.path.split('/').pop()}</div>
                        <div className="conflict-meta">
                            Local v{conflict.localVersion} vs Server v{conflict.serverVersion}
                        </div>
                    </div>
                    <ChevronRight size={16} className="conflict-arrow" />
                </div>
            ))}
        </div>
    );
};

// Conflict Resolver Component
interface ConflictResolverProps {
    conflict: SyncConflict;
    onBack: () => void;
    onResolve: (conflict: SyncConflict, resolution: 'local' | 'server') => void;
}

const ConflictResolver: React.FC<ConflictResolverProps> = ({
    conflict,
    onBack,
    onResolve,
}) => {
    const [selectedSide, setSelectedSide] = useState<'local' | 'server' | null>(null);

    return (
        <div className="conflict-resolver">
            {/* Back button */}
            <button className="back-btn" onClick={onBack}>
                ← Back to conflicts
            </button>

            {/* File info */}
            <div className="conflict-file-info">
                <h3>{conflict.path.split('/').pop()}</h3>
                <p className="conflict-path-full">{conflict.path}</p>
            </div>

            {/* Side-by-side comparison */}
            <div className="conflict-comparison">
                {/* Local version */}
                <div
                    className={`conflict-side ${selectedSide === 'local' ? 'selected' : ''}`}
                    onClick={() => setSelectedSide('local')}
                >
                    <div className="side-header local">
                        <HardDrive size={14} />
                        <span>Local Version</span>
                        <span className="version-badge">v{conflict.localVersion}</span>
                    </div>
                    <div className="side-content">
                        <pre>{conflict.localContent || '(Unable to load content)'}</pre>
                    </div>
                </div>

                {/* Server version */}
                <div
                    className={`conflict-side ${selectedSide === 'server' ? 'selected' : ''}`}
                    onClick={() => setSelectedSide('server')}
                >
                    <div className="side-header server">
                        <Cloud size={14} />
                        <span>Server Version</span>
                        <span className="version-badge">v{conflict.serverVersion}</span>
                    </div>
                    <div className="side-content">
                        <pre>{conflict.serverContent || '(Unable to load content)'}</pre>
                    </div>
                </div>
            </div>

            {/* Resolution actions */}
            <div className="conflict-actions">
                <button
                    className="sync-btn"
                    onClick={onBack}
                >
                    Cancel
                </button>
                <button
                    className={`sync-btn ${selectedSide === 'local' ? 'primary' : ''}`}
                    onClick={() => onResolve(conflict, 'local')}
                    disabled={selectedSide !== 'local'}
                >
                    <HardDrive size={14} />
                    Keep Local
                </button>
                <button
                    className={`sync-btn ${selectedSide === 'server' ? 'primary' : ''}`}
                    onClick={() => onResolve(conflict, 'server')}
                    disabled={selectedSide !== 'server'}
                >
                    <Cloud size={14} />
                    Use Server
                </button>
            </div>
        </div>
    );
};
