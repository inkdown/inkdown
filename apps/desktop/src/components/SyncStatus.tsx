import type { SyncVerificationResult } from '@inkdown/core';
import { SyncStatusIndicator, type SyncStatus as UISyncStatus } from '@inkdown/ui';
import type React from 'react';
import { useCallback, useEffect, useState } from 'react';
import { useApp } from '../contexts/AppContext';
import { SyncModal } from './SyncModal';
import './SyncStatus.css';

type SyncState = UISyncStatus;

export const SyncStatus: React.FC<{ onLinkWorkspace?: () => void }> = ({ onLinkWorkspace }) => {
    const app = useApp();
    const [status, setStatus] = useState<SyncState>('idle');
    const [pendingCount, setPendingCount] = useState(0);
    const [conflictCount, setConflictCount] = useState(0);
    const [lastError, setLastError] = useState<string | null>(null);
    const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
    const [isEnabled, setIsEnabled] = useState(false);
    const [verificationResult, setVerificationResult] = useState<SyncVerificationResult | null>(
        null,
    );
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [workspaceName, setWorkspaceName] = useState<string | undefined>(undefined);

    const loadWorkspaceName = useCallback(async () => {
        const currentId = app.syncManager.getCurrentWorkspaceId();
        if (currentId) {
            try {
                const workspaces = await app.syncManager.listWorkspaces();
                const current = workspaces.find((w) => w.id === currentId);
                if (current) {
                    setWorkspaceName(current.name);
                }
            } catch (error: any) {
                console.error('Failed to load workspace name:', error);
            }
        } else {
            setWorkspaceName(undefined);
        }
    }, [app.syncManager]);

    // Verify sync status periodically
    const verifySyncStatus = useCallback(async () => {
        const syncEngine = app.syncManager.syncEngine;
        if (!syncEngine || !app.syncManager.isEnabled()) return;

        try {
            const result = await syncEngine.verifySyncStatus();
            setVerificationResult(result);

            // Update status based on verification
            if (result.conflicts > 0) {
                setStatus('conflict');
                setConflictCount(result.conflicts);
            } else if (result.pending > 0) {
                setStatus('pending');
                setPendingCount(result.pending);
            } else {
                setStatus('idle');
                setPendingCount(0);
            }
        } catch (error: any) {
            console.error('Failed to verify sync status:', error);
        }
    }, [app]);

    useEffect(() => {
        // Initial state check
        const checkState = async () => {
            const enabled = app.syncManager.isEnabled();
            setIsEnabled(enabled);

            if (enabled && app.syncManager.syncEngine) {
                setPendingCount(app.syncManager.syncEngine.getPendingChanges());
                setStatus(app.syncManager.syncEngine.isSyncing() ? 'syncing' : 'idle');

                // Load last sync time
                const config = await app.configManager.loadConfig<any>('sync');
                if (config?.lastSyncTime) {
                    setLastSyncTime(new Date(config.lastSyncTime));
                }

                loadWorkspaceName();

                // Verify actual sync status after initial check
                setTimeout(() => verifySyncStatus(), 2000);
            } else if (enabled) {
                setStatus('idle');
            } else {
                setStatus('offline');
            }
        };

        checkState();

        // Subscribe to sync engine events
        const syncEngine = app.syncManager.syncEngine;
        if (!syncEngine) return;

        const handleSyncStart = () => {
            setStatus('syncing');
            setLastError(null);
        };

        const handleSyncComplete = () => {
            setLastSyncTime(new Date());
            // Verify status after sync completes to ensure accuracy
            verifySyncStatus();
        };

        const handleSyncError = (error: any) => {
            setStatus('error');
            setLastError(error.message || 'Unknown error');
            console.error('Sync error:', error);
        };

        const handleCountChange = (count: number) => {
            setPendingCount(count);
            if (count > 0 && status !== 'syncing') {
                setStatus('pending');
            }
        };

        const handleRemoteUpdate = () => {
            setLastSyncTime(new Date());
        };

        const handleStatusVerified = (result: SyncVerificationResult) => {
            setVerificationResult(result);
            if (result.conflicts > 0) {
                setStatus('conflict');
                setConflictCount(result.conflicts);
            } else if (result.pending > 0 && status !== 'syncing') {
                setStatus('pending');
                setPendingCount(result.pending);
            } else if (status !== 'syncing') {
                setStatus('idle');
            }
        };

        const refs = [
            syncEngine.on('sync-start', handleSyncStart),
            syncEngine.on('sync-complete', handleSyncComplete),
            syncEngine.on('sync-error', handleSyncError),
            syncEngine.on('sync-count-change', handleCountChange),
            syncEngine.on('sync-remote-update', handleRemoteUpdate),
            syncEngine.on('sync-status-verified', handleStatusVerified),
        ];

        // Periodic verification (every 2 minutes)
        const verifyInterval = setInterval(verifySyncStatus, 120000);

        return () => {
            refs.forEach((ref) => {
                ref.unload();
            });
            clearInterval(verifyInterval);
        };
    }, [app, app.syncManager.syncEngine, verifySyncStatus, loadWorkspaceName, status]);

    // Handle click to open sync modal
    const handleClick = () => {
        if (!app.syncManager.isEnabled()) return;

        const currentId = app.syncManager.getCurrentWorkspaceId();
        if (!currentId && onLinkWorkspace) {
            onLinkWorkspace();
            return;
        }

        setIsModalOpen(true);
    };

    if (!isEnabled) {
        return null;
    }

    let tooltip = '';
    if (status === 'synced' || status === 'idle') {
        tooltip = verificationResult
            ? `Synced (${verificationResult.synced}/${verificationResult.total}). Last: ${lastSyncTime ? lastSyncTime.toLocaleTimeString() : 'Never'}`
            : `Synced. Last: ${lastSyncTime ? lastSyncTime.toLocaleTimeString() : 'Never'}`;
    } else if (status === 'syncing') {
        tooltip = `Syncing... ${pendingCount > 0 ? `${pendingCount} files pending` : ''}`;
    } else if (status === 'error') {
        tooltip = `Sync Error: ${lastError}`;
    } else if (status === 'offline') {
        tooltip = 'Sync Offline';
    } else if (status === 'conflict') {
        tooltip = `${conflictCount} conflict${conflictCount > 1 ? 's' : ''} detected. Click to sync.`;
    } else if (status === 'pending') {
        tooltip = `${pendingCount} file${pendingCount > 1 ? 's' : ''} pending sync. Click to sync now.`;
    }

    return (
        <>
            <SyncStatusIndicator
                status={status}
                workspaceName={workspaceName}
                pendingCount={pendingCount || conflictCount}
                errorMessage={lastError || undefined}
                tooltip={tooltip}
                onClick={handleClick}
            />
            <SyncModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
        </>
    );
};
