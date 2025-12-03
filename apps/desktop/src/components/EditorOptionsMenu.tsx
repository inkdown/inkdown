import {
    Bookmark,
    Clipboard,
    Columns2,
    Copy,
    ExternalLink,
    Eye,
    FileEdit,
    FolderInput,
    Link,
    MoreVertical,
    Pencil,
    Trash2,
} from 'lucide-react';
import type React from 'react';
import { useEffect, useRef, useState } from 'react';
import './EditorOptionsMenu.css';

export type ViewMode = 'editor' | 'side-by-side' | 'preview';

interface EditorOptionsMenuProps {
    viewMode: ViewMode;
    onViewModeChange: (mode: ViewMode) => void;
    onRename: () => void;
    onAddBookmark: () => void;
    onDelete: () => void;
    onMoveTo: () => void;
    onMakeCopy: () => void;
    onCopyPath: () => void;
    onCopyRelativePath: () => void;
    onShowInExplorer: () => void;
}

export const EditorOptionsMenu: React.FC<EditorOptionsMenuProps> = ({
    viewMode,
    onViewModeChange,
    onRename,
    onAddBookmark,
    onDelete,
    onMoveTo,
    onMakeCopy,
    onCopyPath,
    onCopyRelativePath,
    onShowInExplorer,
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    const handleViewModeClick = (mode: ViewMode) => {
        onViewModeChange(mode);
        // Don't close menu immediately to allow user to see selection?
        // Or close it? Standard behavior is usually to close.
        setIsOpen(false);
    };

    return (
        <div className="editor-options-menu" ref={menuRef}>
            <button
                className={`editor-options-button ${isOpen ? 'active' : ''}`}
                onClick={() => setIsOpen(!isOpen)}
                title="Options"
            >
                <MoreVertical size={20} />
            </button>

            {isOpen && (
                <div className="editor-options-dropdown">
                    <div className="editor-options-section">
                        <div className="editor-options-label">View Mode</div>
                        <div className="view-mode-selector">
                            <button
                                className={`view-mode-option ${viewMode === 'editor' ? 'active' : ''}`}
                                onClick={() => handleViewModeClick('editor')}
                                title="Editor Only"
                            >
                                <FileEdit size={16} />
                            </button>
                            <button
                                className={`view-mode-option ${viewMode === 'side-by-side' ? 'active' : ''}`}
                                onClick={() => handleViewModeClick('side-by-side')}
                                title="Side by Side"
                            >
                                <Columns2 size={16} />
                            </button>
                            <button
                                className={`view-mode-option ${viewMode === 'preview' ? 'active' : ''}`}
                                onClick={() => handleViewModeClick('preview')}
                                title="Preview Only"
                            >
                                <Eye size={16} />
                            </button>
                        </div>
                    </div>

                    <div className="editor-options-divider" />

                    <div className="editor-options-section">
                        <button
                            className="editor-menu-item"
                            onClick={() => {
                                onRename();
                                setIsOpen(false);
                            }}
                        >
                            <Pencil size={16} />
                            <span>Rename Note</span>
                        </button>
                        <button
                            className="editor-menu-item"
                            onClick={() => {
                                onAddBookmark();
                                setIsOpen(false);
                            }}
                        >
                            <Bookmark size={16} />
                            <span>Add to Bookmarks</span>
                        </button>
                        <button
                            className="editor-menu-item"
                            onClick={() => {
                                onMoveTo();
                                setIsOpen(false);
                            }}
                        >
                            <FolderInput size={16} />
                            <span>Move Note To...</span>
                        </button>
                        <button
                            className="editor-menu-item"
                            onClick={() => {
                                onMakeCopy();
                                setIsOpen(false);
                            }}
                        >
                            <Copy size={16} />
                            <span>Make a Copy</span>
                        </button>
                        <button
                            className="editor-menu-item delete"
                            onClick={() => {
                                onDelete();
                                setIsOpen(false);
                            }}
                        >
                            <Trash2 size={16} />
                            <span>Delete Note</span>
                        </button>
                    </div>

                    <div className="editor-options-divider" />

                    <div className="editor-options-section">
                        <button
                            className="editor-menu-item"
                            onClick={() => {
                                onCopyPath();
                                setIsOpen(false);
                            }}
                        >
                            <Clipboard size={16} />
                            <span>Copy Path</span>
                        </button>
                        <button
                            className="editor-menu-item"
                            onClick={() => {
                                onCopyRelativePath();
                                setIsOpen(false);
                            }}
                        >
                            <Link size={16} />
                            <span>Copy Relative Path</span>
                        </button>
                        <button
                            className="editor-menu-item"
                            onClick={() => {
                                onShowInExplorer();
                                setIsOpen(false);
                            }}
                        >
                            <ExternalLink size={16} />
                            <span>Show in System Explorer</span>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};
