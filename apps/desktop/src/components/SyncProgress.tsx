import { Check, Cloud, Download, Loader, Upload } from 'lucide-react';
import type React from 'react';
import './SyncProgress.css';

export type SyncProgressOperation = 'download' | 'upload' | 'check' | 'idle' | 'complete';

export interface SyncProgressProps {
    /** Current operation being performed */
    operation: SyncProgressOperation;
    /** Current item being processed (1-based) */
    current?: number;
    /** Total items to process */
    total?: number;
    /** Name of file being processed */
    currentFile?: string;
    /** Whether sync is in progress */
    isActive?: boolean;
}

/**
 * SyncProgress - Visual indicator of sync operations
 * Shows current sync status with progress bar and operation details
 */
export const SyncProgress: React.FC<SyncProgressProps> = ({
    operation,
    current = 0,
    total = 0,
    currentFile,
    isActive = false,
}) => {
    const progressPercent = total > 0 ? Math.round((current / total) * 100) : 0;

    const getOperationText = (): string => {
        switch (operation) {
            case 'download':
                return 'Downloading';
            case 'upload':
                return 'Uploading';
            case 'check':
                return 'Checking for changes';
            case 'complete':
                return 'Sync complete';
            default:
                return 'Ready';
        }
    };

    const getOperationIcon = () => {
        switch (operation) {
            case 'download':
                return <Download size={14} className="progress-icon downloading" />;
            case 'upload':
                return <Upload size={14} className="progress-icon uploading" />;
            case 'check':
                return <Loader size={14} className="progress-icon spin" />;
            case 'complete':
                return <Check size={14} className="progress-icon complete" />;
            default:
                return <Cloud size={14} className="progress-icon idle" />;
        }
    };

    return (
        <div className={`sync-progress ${isActive ? 'active' : ''} ${operation}`}>
            <div className="sync-progress-header">
                {getOperationIcon()}
                <span className="sync-progress-text">{getOperationText()}</span>
                {total > 0 && (
                    <span className="sync-progress-count">
                        {current} / {total}
                    </span>
                )}
            </div>

            {isActive && total > 0 && (
                <div className="sync-progress-bar-container">
                    <div className="sync-progress-bar" style={{ width: `${progressPercent}%` }} />
                </div>
            )}

            {currentFile && isActive && <div className="sync-progress-file">{currentFile}</div>}
        </div>
    );
};
