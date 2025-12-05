import { useState, useEffect, useCallback } from 'react';
import { Modal } from './Modal';
import { Button } from './Button';
import { Folder, Plus, Check } from 'lucide-react';
import '../styles/WorkspaceLinkDialog.css';

export interface Workspace {
    id: string;
    name: string;
    created_at: string;
    updated_at: string;
    is_default: boolean;
    note_count?: number;
}

export interface WorkspaceLinkDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onLink: (workspaceId: string) => Promise<void>;
    onCreateAndLink: (name: string) => Promise<void>;
    listWorkspaces: () => Promise<Workspace[]>;
    localPath?: string;
}

/**
 * Dialog for linking a local directory to a remote workspace
 */
export function WorkspaceLinkDialog({
    isOpen,
    onClose,
    onLink,
    onCreateAndLink,
    listWorkspaces,
    localPath,
}: WorkspaceLinkDialogProps) {
    const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [newWorkspaceName, setNewWorkspaceName] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showCreateForm, setShowCreateForm] = useState(false);

    const loadWorkspaces = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const list = await listWorkspaces();
            setWorkspaces(list);
            // Auto-select default workspace if exists
            const defaultWs = list.find(w => w.is_default);
            if (defaultWs) {
                setSelectedId(defaultWs.id);
            }
        } catch (err) {
            setError('Failed to load workspaces. Please try again.');
            console.error('Failed to load workspaces:', err);
        } finally {
            setIsLoading(false);
        }
    }, [listWorkspaces]);

    useEffect(() => {
        if (isOpen) {
            loadWorkspaces();
            setShowCreateForm(false);
            setNewWorkspaceName('');
        }
    }, [isOpen, loadWorkspaces]);

    const handleLink = async () => {
        if (!selectedId) return;

        setIsSubmitting(true);
        setError(null);
        try {
            await onLink(selectedId);
            onClose();
        } catch (err) {
            setError('Failed to link workspace. Please try again.');
            console.error('Failed to link workspace:', err);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCreateAndLink = async () => {
        if (!newWorkspaceName.trim()) return;

        setIsSubmitting(true);
        setError(null);
        try {
            await onCreateAndLink(newWorkspaceName.trim());
            onClose();
        } catch (err) {
            setError('Failed to create workspace. Please try again.');
            console.error('Failed to create workspace:', err);
        } finally {
            setIsSubmitting(false);
        }
    };

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString(undefined, {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Link to Workspace" size="medium">
            <div className="workspace-link-dialog">
                {localPath && (
                    <p style={{ marginBottom: 16, color: 'var(--text-muted)', fontSize: 14 }}>
                        <Folder size={14} style={{ marginRight: 6, verticalAlign: 'middle' }} />
                        {localPath}
                    </p>
                )}

                {error && (
                    <div className="error-state">
                        {error}
                    </div>
                )}

                {isLoading ? (
                    <div className="loading-state">
                        Loading workspaces...
                    </div>
                ) : workspaces.length === 0 && !showCreateForm ? (
                    <div className="empty-state">
                        <p>No workspaces found. Create your first workspace to start syncing.</p>
                        <Button variant="primary" onClick={() => setShowCreateForm(true)}>
                            <Plus size={16} style={{ marginRight: 6 }} />
                            Create Workspace
                        </Button>
                    </div>
                ) : (
                    <>
                        <div className="workspace-list">
                            {workspaces.map(workspace => (
                                <div
                                    key={workspace.id}
                                    className={`workspace-item ${selectedId === workspace.id ? 'selected' : ''}`}
                                    onClick={() => setSelectedId(workspace.id)}
                                >
                                    <div className="workspace-item-info">
                                        <span className="workspace-name">{workspace.name}</span>
                                        <span className="workspace-meta">
                                            <span>Created {formatDate(workspace.created_at)}</span>
                                            {workspace.note_count !== undefined && (
                                                <span>{workspace.note_count} notes</span>
                                            )}
                                        </span>
                                    </div>
                                    {workspace.is_default && (
                                        <span className="workspace-badge">Default</span>
                                    )}
                                    {selectedId === workspace.id && (
                                        <Check size={18} style={{ color: 'var(--accent-color)' }} />
                                    )}
                                </div>
                            ))}
                        </div>

                        <div className="create-new-section">
                            {showCreateForm ? (
                                <div className="create-new-form">
                                    <input
                                        type="text"
                                        placeholder="New workspace name..."
                                        value={newWorkspaceName}
                                        onChange={(e) => setNewWorkspaceName(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' && newWorkspaceName.trim()) {
                                                handleCreateAndLink();
                                            }
                                        }}
                                        autoFocus
                                    />
                                    <Button
                                        variant="primary"
                                        onClick={handleCreateAndLink}
                                        disabled={!newWorkspaceName.trim() || isSubmitting}
                                    >
                                        Create & Link
                                    </Button>
                                    <Button
                                        variant="secondary"
                                        onClick={() => {
                                            setShowCreateForm(false);
                                            setNewWorkspaceName('');
                                        }}
                                    >
                                        Cancel
                                    </Button>
                                </div>
                            ) : (
                                <Button
                                    variant="secondary"
                                    onClick={() => setShowCreateForm(true)}
                                    style={{ width: '100%' }}
                                >
                                    <Plus size={16} style={{ marginRight: 6 }} />
                                    Create New Workspace
                                </Button>
                            )}
                        </div>

                        <div className="dialog-actions">
                            <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>
                                Cancel
                            </Button>
                            <Button
                                variant="primary"
                                onClick={handleLink}
                                disabled={!selectedId || isSubmitting || showCreateForm}
                            >
                                {isSubmitting ? 'Linking...' : 'Link Workspace'}
                            </Button>
                        </div>
                    </>
                )}
            </div>
        </Modal>
    );
}
