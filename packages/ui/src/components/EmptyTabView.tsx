import { FolderOpen, Plus } from 'lucide-react';
import type React from 'react';
import '../styles/EmptyTabView.css';

export interface EmptyTabViewProps {
    onNewFile?: () => void;
    onOpenFile?: () => void;
}

/**
 * Empty Tab View - Shown when a tab has no file
 */
export const EmptyTabView: React.FC<EmptyTabViewProps> = ({ onNewFile, onOpenFile }) => {
    return (
        <div className="empty-tab-view">
            <div className="empty-tab-content">

                <h2>No file open</h2>
                <p>Create a new note or select a file from the explorer</p>

                <div className="empty-tab-actions">
                    {onNewFile && (
                        <button className="empty-tab-button" onClick={onNewFile}>
                            <Plus size={18} />
                            New Note
                        </button>
                    )}
                    {onOpenFile && (
                        <button className="empty-tab-button secondary" onClick={onOpenFile}>
                            <FolderOpen size={18} />
                            Open File
                        </button>
                    )}
                </div>

                <div className="empty-tab-shortcuts">
                    <div className="shortcut">
                        <kbd>Ctrl</kbd> + <kbd>N</kbd>
                        <span>New note</span>
                    </div>
                    <div className="shortcut">
                        <kbd>Ctrl</kbd> + <kbd>O</kbd>
                        <span>Open file</span>
                    </div>
                </div>
            </div>
        </div>
    );
};
