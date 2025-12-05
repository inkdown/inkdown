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
import { useCallback, useEffect, useRef, useState } from 'react';
import { native, type MenuItem } from '@inkdown/core/native';
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

    const handleButtonClick = useCallback(async (event: React.MouseEvent) => {
        // Try native menu first
        if (native.supportsModule('menu')) {
            const button = event.currentTarget as HTMLElement;
            const rect = button.getBoundingClientRect();

            const items: MenuItem[] = [
                // View Mode section
                {
                    id: 'view-mode',
                    type: 'submenu',
                    text: 'View Mode',
                    items: [
                        {
                            id: 'view-editor',
                            type: 'checkbox',
                            text: 'Editor Only',
                            checked: viewMode === 'editor',
                            action: () => onViewModeChange('editor'),
                        },
                        {
                            id: 'view-side-by-side',
                            type: 'checkbox',
                            text: 'Side by Side',
                            checked: viewMode === 'side-by-side',
                            action: () => onViewModeChange('side-by-side'),
                        },
                        {
                            id: 'view-preview',
                            type: 'checkbox',
                            text: 'Preview Only',
                            checked: viewMode === 'preview',
                            action: () => onViewModeChange('preview'),
                        },
                    ],
                },
                { type: 'separator' },
                // File actions
                {
                    id: 'rename',
                    type: 'normal',
                    text: 'Rename Note',
                    action: onRename,
                },
                {
                    id: 'add-bookmark',
                    type: 'normal',
                    text: 'Add to Bookmarks',
                    action: onAddBookmark,
                },
                {
                    id: 'move-to',
                    type: 'normal',
                    text: 'Move Note To...',
                    action: onMoveTo,
                },
                {
                    id: 'make-copy',
                    type: 'normal',
                    text: 'Make a Copy',
                    action: onMakeCopy,
                },
                {
                    id: 'delete',
                    type: 'normal',
                    text: 'Delete Note',
                    action: onDelete,
                },
                { type: 'separator' },
                // Path actions
                {
                    id: 'copy-path',
                    type: 'normal',
                    text: 'Copy Path',
                    action: onCopyPath,
                },
                {
                    id: 'copy-relative-path',
                    type: 'normal',
                    text: 'Copy Relative Path',
                    action: onCopyRelativePath,
                },
                {
                    id: 'show-in-explorer',
                    type: 'normal',
                    text: 'Show in System Explorer',
                    action: onShowInExplorer,
                },
            ];

            await native.menu?.showContextMenu({
                items,
                position: {
                    x: Math.round(rect.right),
                    y: Math.round(rect.bottom + 4),
                },
            });
        } else {
            // Fall back to React menu
            setIsOpen(!isOpen);
        }
    }, [viewMode, isOpen, onViewModeChange, onRename, onAddBookmark, onDelete, onMoveTo, onMakeCopy, onCopyPath, onCopyRelativePath, onShowInExplorer]);

    return (
        <div className="editor-options-menu" ref={menuRef}>
            <button
                className={`editor-options-button ${isOpen ? 'active' : ''}`}
                onClick={handleButtonClick}
                title="Options"
            >
                <MoreVertical size={20} />
            </button>

            {/* Fallback React menu when native menus not supported */}
            {!native.supportsModule('menu') && isOpen && (
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
