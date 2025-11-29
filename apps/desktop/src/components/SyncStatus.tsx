import React, { useEffect, useState } from 'react';
import { useApp } from '../contexts/AppContext';
import { CloudOff, RefreshCw, AlertCircle, Check } from 'lucide-react';
import './SyncStatus.css';

type SyncState = 'idle' | 'syncing' | 'error' | 'offline';

export const SyncStatus: React.FC = () => {
    const app = useApp();
    const [status, setStatus] = useState<SyncState>('idle');
    const [pendingCount, setPendingCount] = useState(0);
    const [lastError, setLastError] = useState<string | null>(null);
    const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
    const [isEnabled, setIsEnabled] = useState(false);

    useEffect(() => {
        // Initial state check
        const checkState = async () => {
            const enabled = app.syncManager.isEnabled();
            setIsEnabled(enabled);

            if (enabled && app.syncManager.syncEngine) {
                setPendingCount(app.syncManager.syncEngine.getPendingChanges());
                setStatus(app.syncManager.syncEngine.isActive() ? 'syncing' : 'idle');

                // Load last sync time
                const config = await app.configManager.loadConfig<any>('sync');
                if (config?.lastSyncTime) {
                    setLastSyncTime(new Date(config.lastSyncTime));
                }
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
            setStatus('idle');
            setLastSyncTime(new Date());
            setPendingCount(0);
        };

        const handleSyncError = (error: any) => {
            setStatus('error');
            setLastError(error.message || 'Unknown error');
            console.error('Sync error:', error);
        };

        const handleCountChange = (count: number) => {
            setPendingCount(count);
        };

        const handleRemoteUpdate = () => {
            setLastSyncTime(new Date());
        };

        // Register event listeners
        // Note: We need to cast to any because EventRef type might not be perfectly inferred here
        // or we can just use the internal 'on' method if exposed properly.
        // Since SyncEngine extends Events, we can use .on()

        const refs = [
            syncEngine.on('sync-start', handleSyncStart),
            syncEngine.on('sync-complete', handleSyncComplete),
            syncEngine.on('sync-error', handleSyncError),
            syncEngine.on('sync-count-change', handleCountChange),
            syncEngine.on('sync-remote-update', handleRemoteUpdate),
        ];

        return () => {
            refs.forEach(ref => ref.unload());
        };
    }, [app, app.syncManager.syncEngine, app.syncManager.isEnabled()]); // Re-run if sync engine instance changes

    if (!isEnabled) {
        return null;
    }

    let icon;
    let tooltip = '';
    let className = 'sync-status-item';

    switch (status) {
        case 'syncing':
            icon = <RefreshCw size={14} className="spin" />;
            tooltip = `Syncing... ${pendingCount > 0 ? `${pendingCount} files pending` : ''}`;
            className += ' syncing';
            break;
        case 'error':
            icon = <AlertCircle size={14} className="error" />;
            tooltip = `Sync Error: ${lastError}`;
            className += ' error';
            break;
        case 'offline':
            icon = <CloudOff size={14} />;
            tooltip = 'Sync Offline';
            break;
        case 'idle':
        default:
            icon = pendingCount > 0 ? <RefreshCw size={14} /> : <Check size={14} />;
            tooltip = `Synced. Last sync: ${lastSyncTime ? lastSyncTime.toLocaleTimeString() : 'Never'}`;
            break;
    }

    return (
        <div className={className} title={tooltip}>
            {icon}
            {pendingCount > 0 && <span className="sync-count">{pendingCount}</span>}
        </div>
    );
};
