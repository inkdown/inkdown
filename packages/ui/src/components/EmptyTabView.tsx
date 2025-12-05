import type React from 'react';
import '../styles/EmptyTabView.css';

/**
 * Detect if running on macOS
 */
const isMacOS = typeof navigator !== 'undefined' && navigator.platform.toUpperCase().indexOf('MAC') >= 0;

/**
 * Get the modifier key label based on platform
 */
const modKey = isMacOS ? '⌘' : 'Ctrl';

/**
 * Empty Tab View - Shown when a tab has no file
 */
export const EmptyTabView: React.FC = () => {
    return (
        <div className="empty-tab-view">
            <div className="empty-tab-content">

                <h2>No file open</h2>
                <p>Create a new note or select a file from the explorer</p>

                <div className="empty-tab-shortcuts">
                    <div className="shortcut">
                        <kbd>{modKey}</kbd> + <kbd>N</kbd>
                        <span>New note</span>
                    </div>
                    <div className="shortcut">
                        <kbd>{modKey}</kbd> + <kbd>Shift</kbd> + <kbd>O</kbd>
                        <span>Open workspace</span>
                    </div>
                </div>
            </div>
        </div>
    );
};
