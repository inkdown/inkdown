import { Cloud, CloudOff, RefreshCw, AlertCircle, Check, AlertTriangle } from 'lucide-react';
import '../styles/SyncStatusIndicator.css';

export type SyncStatus = 'synced' | 'syncing' | 'error' | 'offline' | 'pending' | 'conflict' | 'idle';

export interface SyncStatusIndicatorProps {
    status: SyncStatus;
    workspaceName?: string;
    pendingCount?: number;
    errorMessage?: string;
    tooltip?: string;
    onClick?: () => void;
}

/**
 * Status bar indicator showing sync status and linked workspace
 */
export function SyncStatusIndicator({
    status,
    workspaceName,
    pendingCount = 0,
    errorMessage,
    tooltip,
    onClick,
}: SyncStatusIndicatorProps) {
    const getStatusIcon = () => {
        switch (status) {
            case 'synced':
                return <Check size={14} />;
            case 'syncing':
                return <RefreshCw size={14} />;
            case 'error':
                return <AlertCircle size={14} />;
            case 'offline':
                return <CloudOff size={14} />;
            case 'pending':
                return <Cloud size={14} />;
            case 'conflict':
                return <AlertTriangle size={14} />;
            case 'idle':
                return <Check size={14} />;
            default:
                return <Cloud size={14} />;
        }
    };

    const getStatusText = () => {
        switch (status) {
            case 'synced':
                return 'Synced';
            case 'syncing':
                return 'Syncing...';
            case 'error':
                return errorMessage || 'Sync error';
            case 'offline':
                return 'Offline';
            case 'pending':
                return 'Pending';
            case 'conflict':
                return 'Conflict detected';
            case 'idle':
                return 'Synced';
            default:
                return 'Unknown';
        }
    };

    return (
        <div
            className="sync-status-indicator"
            onClick={onClick}
            title={tooltip || errorMessage || getStatusText()}
        >
            <span className={`status-icon ${status}`}>
                {getStatusIcon()}
            </span>
            {workspaceName && (
                <span className="workspace-name">{workspaceName}</span>
            )}
            {pendingCount > 0 && (
                <span className="sync-count">{pendingCount}</span>
            )}
        </div>
    );
}
