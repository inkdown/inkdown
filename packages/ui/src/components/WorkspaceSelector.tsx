import { Folder, FolderOpen } from 'lucide-react';
import type React from 'react';
import { useState } from 'react';
import '../styles/WorkspaceSelector.css';

export interface WorkspaceSelectorProps {
    onWorkspaceSelected: (path: string) => void;
    onOpenDialog: () => Promise<string | null>;
    recentWorkspaces?: string[];
}

/**
 * Workspace Selector Component - Shown when no workspace is open
 */
export const WorkspaceSelector: React.FC<WorkspaceSelectorProps> = ({
    onWorkspaceSelected,
    onOpenDialog,
    recentWorkspaces = [],
}) => {
    const [isOpening, setIsOpening] = useState(false);

    const handleOpenFolder = async () => {
        setIsOpening(true);
        try {
            const path = await onOpenDialog();
            if (path) {
                onWorkspaceSelected(path);
            }
        } catch (error) {
            console.error('Failed to open folder:', error);
        } finally {
            setIsOpening(false);
        }
    };

    return (
        <div className="workspace-selector">
            <div className="workspace-selector-content">
                <div className="workspace-selector-logo">
                    <h1>Inkdown</h1>
                </div>

                <p className="workspace-selector-subtitle">
                    A minimal markdown editor for focused writing
                </p>

                <button
                    type="button"
                    className="workspace-selector-button"
                    onClick={handleOpenFolder}
                    disabled={isOpening}
                >
                    <FolderOpen size={20} />
                    {isOpening ? 'Opening...' : 'Open Folder'}
                </button>

                {recentWorkspaces.length > 0 && (
                    <div className="workspace-selector-recent">
                        <h3>Recent Workspaces</h3>
                        <ul>
                            {recentWorkspaces.map((path) => (
                                <li key={path}>
                                    <button type="button" onClick={() => onWorkspaceSelected(path)}>
                                        <Folder size={16} />
                                        <span>{path.split('/').pop()}</span>
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>
        </div>
    );
};
