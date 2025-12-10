import type { BookmarkGroup, FileNode, RecentWorkspace } from '@inkdown/core';
import { type MenuItem, native } from '@inkdown/core/native';
import { WorkspaceSwitcher } from '@inkdown/ui';
import {
    ArrowDownAZ,
    ArrowUpAZ,
    Bookmark,
    Check,
    ChevronsDown,
    ChevronsUp,
    Clipboard,
    Cloud,
    CloudOff,
    Copy,
    Edit2,
    ExternalLink,
    File,
    Folder,
    FolderInput,
    FolderOpen,
    FolderPlus,
    Link,
    Plus,
    Settings,
    Trash2,
} from 'lucide-react';
import type React from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useApp } from '../contexts/AppContext';
import { BookmarkGroupModal } from './BookmarkGroupModal';
import { CreateBookmarkGroupModal } from './CreateBookmarkGroupModal';
import '../styles/FileExplorer.css';

/**
 * Platform detection
 */
const isMacOS = navigator.platform.toUpperCase().indexOf('MAC') >= 0;

export type SelectedItem = {
    path: string;
    isDirectory: boolean;
    name: string;
};

export type SortOrder = 'a-z' | 'z-a';

export interface FileExplorerProps {
    rootPath: string;
    activeFilePath?: string | null;
    files: FileNode[];
    /** Initial expanded directories (loaded from config) */
    initialExpandedDirs?: string[];
    /** Callback when expanded directories change (for persistence) */
    onExpandedDirsChange?: (expandedDirs: string[]) => void;
    onFileSelect: (filePath: string, openInNewTab?: boolean) => void;
    onCreateFile: (parentPath: string) => Promise<void>;
    onCreateDirectory: (parentPath: string) => Promise<void>;
    onRename: (oldPath: string, newName: string) => Promise<void>;
    onDelete: (path: string, isDirectory: boolean) => Promise<void>;
    onDeleteMultiple?: (paths: Array<{ path: string; isDirectory: boolean }>) => Promise<void>;
    onMove: (source: string, destination: string) => Promise<void>;
    onMoveMultiple?: (sources: string[], destination: string) => Promise<void>;
    onCopyFile?: (sourcePath: string) => Promise<void>;
    onMoveTo?: (sourcePath: string) => Promise<void>;
    onCopyPath?: (path: string) => Promise<void>;
    onCopyRelativePath?: (path: string) => Promise<void>;
    onShowInExplorer?: (path: string) => Promise<void>;
    /** Callback to request delete confirmation (for native dialogs) */
    onRequestDeleteConfirm?: (items: SelectedItem[]) => Promise<boolean>;
    onRefresh: () => void;
    /** Whether the sidebar is collapsed */
    isCollapsed: boolean;
    /** Current width of the sidebar (when not collapsed) */
    width: number;
    /** Minimum width for resize */
    minWidth?: number;
    /** Maximum width for resize */
    maxWidth?: number;
    /** Callback when collapsed state changes */
    onCollapsedChange: (collapsed: boolean) => void;
    /** Callback when width changes */
    onWidthChange: (width: number) => void;
    /** Callback to open settings */
    onOpenSettings?: () => void;
    /** Initial sort order */
    initialSortOrder?: SortOrder;
    /** Callback when sort order changes */
    onSortOrderChange?: (order: SortOrder) => void;
    /** Recent workspaces for workspace switcher */
    recentWorkspaces?: RecentWorkspace[];
    /** Callback when workspace is switched */
    onWorkspaceSwitch?: (path: string) => void;
    /** Callback to browse for new workspace */
    onBrowseWorkspace?: () => void;
    /** Callback to toggle sync ignore status */
    onToggleSyncIgnore?: (path: string, ignored: boolean) => Promise<void>;
    /** Callback to check if path is ignored */
    isSyncIgnored?: (path: string) => boolean;
    /** Whether to show macOS traffic lights (custom titlebar mode) */
    useCustomTitleBar?: boolean;
}

type CreatingItem = {
    parentPath: string;
    type: 'file' | 'directory';
    tempId: string;
};

const DEFAULT_MIN_WIDTH = 180;
const DEFAULT_MAX_WIDTH = 500;
const DEFAULT_WIDTH = 250;

// Helper to get file/directory info from path
const getItemInfo = (path: string, files: FileNode[]): SelectedItem | null => {
    const findInTree = (nodes: FileNode[]): SelectedItem | null => {
        for (const node of nodes) {
            if (node.path === path) {
                return { path: node.path, isDirectory: node.isDirectory, name: node.name };
            }
            if (node.children) {
                const found = findInTree(node.children);
                if (found) return found;
            }
        }
        return null;
    };
    return findInTree(files);
};

// Helper to sort file tree
const sortFileTree = (nodes: FileNode[], order: SortOrder): FileNode[] => {
    // Optimization: Backend already sorts A-Z (directories first)
    if (order === 'a-z') {
        return nodes;
    }

    // For Z-A, we need to reverse the order but keep directories grouped together if possible,
    // OR just strictly reverse based on name?
    // Usually Z-A means: Directories Z-A, then Files Z-A.
    // Since backend returns [Dirs A-Z, Files A-Z], simply reversing the whole array
    // would give [Files Z-A, Dirs Z-A].
    // We probably want [Dirs Z-A, Files Z-A].

    const sorted = [...nodes].sort((a, b) => {
        // Always keep directories first
        if (a.isDirectory && !b.isDirectory) return -1;
        if (!a.isDirectory && b.isDirectory) return 1;

        // Compare names
        return b.name.localeCompare(a.name);
    });

    // Recursively sort children
    return sorted.map((node) => {
        if (node.children) {
            return { ...node, children: sortFileTree(node.children, order) };
        }
        return node;
    });
};

// Helper to get all directory paths
const getAllDirectoryPaths = (nodes: FileNode[]): string[] => {
    let paths: string[] = [];
    for (const node of nodes) {
        if (node.isDirectory) {
            paths.push(node.path);
            if (node.children) {
                paths = paths.concat(getAllDirectoryPaths(node.children));
            }
        }
    }
    return paths;
};

export const FileExplorer: React.FC<FileExplorerProps> = ({
    rootPath,
    activeFilePath,
    files,
    initialExpandedDirs,
    onExpandedDirsChange,
    onFileSelect,
    onCreateFile,
    onCreateDirectory,
    onRename,
    onDelete,
    onDeleteMultiple,
    onMove,
    onMoveMultiple,
    onCopyFile,
    onMoveTo,
    onCopyPath,
    onCopyRelativePath,
    onShowInExplorer,
    onRequestDeleteConfirm,
    onRefresh,
    // Sidebar props
    isCollapsed,
    width,
    minWidth = DEFAULT_MIN_WIDTH,
    maxWidth = DEFAULT_MAX_WIDTH,
    onCollapsedChange: _onCollapsedChange,
    onWidthChange,
    onOpenSettings,
    initialSortOrder = 'a-z',
    onSortOrderChange,
    recentWorkspaces = [],
    onWorkspaceSwitch,
    onBrowseWorkspace,
    onToggleSyncIgnore,
    isSyncIgnored,
    useCustomTitleBar = false,
}) => {
    const app = useApp();
    const [expandedDirs, setExpandedDirs] = useState<Set<string>>(() => {
        return new Set(initialExpandedDirs || []);
    });
    const [expandingDirs, setExpandingDirs] = useState<Set<string>>(new Set());
    const [selectedPaths, setSelectedPaths] = useState<Set<string>>(new Set());
    const [renamingPath, setRenamingPath] = useState<string | null>(null);
    const [creatingItem, setCreatingItem] = useState<CreatingItem | null>(null);
    const [contextMenu, setContextMenu] = useState<{
        x: number;
        y: number;
        path: string | null;
        isDirectory: boolean;
        isRoot?: boolean;
    } | null>(null);
    const [draggedPaths, setDraggedPaths] = useState<Set<string>>(new Set());
    const [dragOverPath, setDragOverPath] = useState<string | null>(null);
    const [lastClickTime, setLastClickTime] = useState<number>(0);
    const [lastClickPath, setLastClickPath] = useState<string | null>(null);
    const [bookmarkModalOpen, setBookmarkModalOpen] = useState(false);
    const [bookmarkFilePath, setBookmarkFilePath] = useState<string>('');
    const [bookmarkFileName, setBookmarkFileName] = useState<string>('');
    const [viewMode, setViewMode] = useState<'files' | 'bookmarks'>('files');
    const [bookmarkGroups, setBookmarkGroups] = useState<BookmarkGroup[]>([]);
    const [expandedBookmarkGroups, setExpandedBookmarkGroups] = useState<Set<string>>(new Set());
    const [createGroupModalOpen, setCreateGroupModalOpen] = useState(false);

    // Sort state
    const [sortOrder, setSortOrder] = useState<SortOrder>(initialSortOrder || 'a-z');
    const [sortMenuOpen, setSortMenuOpen] = useState(false);

    // Update sort order when prop changes
    useEffect(() => {
        if (initialSortOrder) {
            setSortOrder(initialSortOrder);
        }
    }, [initialSortOrder]);

    // Load bookmarks and listen for changes
    useEffect(() => {
        const loadBookmarks = () => {
            const groups = app.bookmarkManager.getGroups();
            setBookmarkGroups(groups);
        };

        loadBookmarks();

        // Listen for bookmark events
        const groupCreatedRef = app.bookmarkManager.on('group-created', loadBookmarks);
        const groupDeletedRef = app.bookmarkManager.on('group-deleted', loadBookmarks);
        const groupRenamedRef = app.bookmarkManager.on('group-renamed', loadBookmarks);
        const bookmarkAddedRef = app.bookmarkManager.on('bookmark-added', loadBookmarks);
        const bookmarkRemovedRef = app.bookmarkManager.on('bookmark-removed', loadBookmarks);
        const bookmarksReloadedRef = app.bookmarkManager.on('bookmarks-reloaded', loadBookmarks);

        return () => {
            groupCreatedRef.unload();
            groupDeletedRef.unload();
            groupRenamedRef.unload();
            bookmarkAddedRef.unload();
            bookmarkRemovedRef.unload();
            bookmarksReloadedRef.unload();
        };
    }, [app]);

    // Memoized sorted files
    const sortedFiles = useMemo(() => {
        return sortFileTree(files, sortOrder);
    }, [files, sortOrder]);

    // Check if all directories are expanded
    const allDirsExpanded = useMemo(() => {
        const allPaths = getAllDirectoryPaths(files);
        if (allPaths.length === 0) return true;
        return allPaths.every((path) => expandedDirs.has(path));
    }, [files, expandedDirs]);

    const handleExpandCollapseAll = useCallback(() => {
        if (allDirsExpanded) {
            // Collapse all
            setExpandedDirs(new Set());
            onExpandedDirsChange?.([]);
        } else {
            // Expand all
            const allPaths = getAllDirectoryPaths(files);
            setExpandedDirs(new Set(allPaths));
            onExpandedDirsChange?.(allPaths);
        }
    }, [files, allDirsExpanded, onExpandedDirsChange]);

    const handleSortChange = useCallback(
        (order: SortOrder) => {
            setSortOrder(order);
            setSortMenuOpen(false);
            onSortOrderChange?.(order);
        },
        [onSortOrderChange],
    );

    const handleSortButtonClick = useCallback(
        async (event: React.MouseEvent) => {
            // Try native menu first
            if (native.supportsModule('menu')) {
                const items: MenuItem[] = [
                    {
                        id: 'sort-a-z',
                        type: 'checkbox',
                        text: 'Name (A to Z)',
                        checked: sortOrder === 'a-z',
                        action: () => handleSortChange('a-z'),
                    },
                    {
                        id: 'sort-z-a',
                        type: 'checkbox',
                        text: 'Name (Z to A)',
                        checked: sortOrder === 'z-a',
                        action: () => handleSortChange('z-a'),
                    },
                ];

                const button = event.currentTarget as HTMLElement;
                const rect = button.getBoundingClientRect();
                await native.menu?.showContextMenu({
                    items,
                    position: {
                        x: Math.round(rect.left),
                        y: Math.round(rect.bottom + 4),
                    },
                });
            } else {
                // Fall back to React menu
                setSortMenuOpen(!sortMenuOpen);
            }
        },
        [sortOrder, sortMenuOpen, handleSortChange],
    );

    // Check if all bookmark groups are expanded
    const allBookmarkGroupsExpanded = useMemo(() => {
        if (bookmarkGroups.length === 0) return true;
        return bookmarkGroups.every((group) => expandedBookmarkGroups.has(group.id));
    }, [bookmarkGroups, expandedBookmarkGroups]);

    const handleExpandCollapseAllBookmarks = useCallback(() => {
        if (allBookmarkGroupsExpanded) {
            // Collapse all
            setExpandedBookmarkGroups(new Set());
        } else {
            // Expand all
            const allGroupIds = bookmarkGroups.map((g) => g.id);
            setExpandedBookmarkGroups(new Set(allGroupIds));
        }
    }, [bookmarkGroups, allBookmarkGroupsExpanded]);

    // Resize state

    // Resize state
    const [isResizing, setIsResizing] = useState(false);
    const startXRef = useRef<number>(0);
    const startWidthRef = useRef<number>(0);

    const containerRef = useRef<HTMLDivElement>(null);

    // Update expanded dirs when initialExpandedDirs changes
    useEffect(() => {
        if (initialExpandedDirs) {
            setExpandedDirs(new Set(initialExpandedDirs));
        }
    }, [initialExpandedDirs]);

    // Sync selected path with active file (only for single file highlight)
    useEffect(() => {
        if (activeFilePath && selectedPaths.size <= 1) {
            setSelectedPaths(new Set([activeFilePath]));
        }
    }, [activeFilePath, selectedPaths.size]);

    const toggleDirectory = useCallback(
        (path: string) => {
            setExpandedDirs((prev) => {
                const newExpanded = new Set(prev);

                if (newExpanded.has(path)) {
                    newExpanded.delete(path);
                } else {
                    newExpanded.add(path);
                    // Mark as expanding for animation
                    setExpandingDirs((prevExpanding) => {
                        const newExpanding = new Set(prevExpanding);
                        newExpanding.add(path);
                        return newExpanding;
                    });

                    // Remove expanding state after animation completes
                    setTimeout(() => {
                        setExpandingDirs((prevExpanding) => {
                            const newExpanding = new Set(prevExpanding);
                            newExpanding.delete(path);
                            return newExpanding;
                        });
                    }, 250); // Match animation duration
                }

                onExpandedDirsChange?.(Array.from(newExpanded));
                return newExpanded;
            });
        },
        [onExpandedDirsChange],
    );

    // Handle item selection with Ctrl support
    const handleItemClick = useCallback(
        (node: FileNode, event: React.MouseEvent) => {
            const isCtrlClick = event.ctrlKey || event.metaKey;
            const now = Date.now();
            const isDoubleClick = lastClickPath === node.path && now - lastClickTime < 300;

            setLastClickTime(now);
            setLastClickPath(node.path);

            if (node.isDirectory) {
                // For directories: toggle expand, and handle selection
                toggleDirectory(node.path);

                if (isCtrlClick) {
                    // Ctrl+click: toggle selection
                    setSelectedPaths((prev) => {
                        const newSet = new Set(prev);
                        if (newSet.has(node.path)) {
                            newSet.delete(node.path);
                        } else {
                            newSet.add(node.path);
                        }
                        return newSet;
                    });
                } else {
                    // Regular click: select only this
                    setSelectedPaths(new Set([node.path]));
                }
            } else if (isCtrlClick || isDoubleClick) {
                // For files: handle selection and open
                // Ctrl+click OR double-click: open in new tab
                setSelectedPaths(new Set([node.path]));
                onFileSelect(node.path, true); // openInNewTab = true
            } else {
                // Regular single click: open in current tab
                setSelectedPaths(new Set([node.path]));
                onFileSelect(node.path, false); // openInNewTab = false
            }
        },
        [lastClickPath, lastClickTime, toggleDirectory, onFileSelect],
    );

    const closeContextMenu = useCallback(() => {
        setContextMenu(null);
    }, []);

    // Close context menu on click outside
    useEffect(() => {
        const handleClick = () => {
            closeContextMenu();
            setSortMenuOpen(false);
        };
        document.addEventListener('click', handleClick);
        return () => document.removeEventListener('click', handleClick);
    }, [closeContextMenu]);

    // Execute delete after confirmation
    const executeDelete = useCallback(
        async (items: SelectedItem[]) => {
            try {
                if (items.length === 1) {
                    await onDelete(items[0].path, items[0].isDirectory);
                } else if (onDeleteMultiple) {
                    await onDeleteMultiple(
                        items.map((i) => ({ path: i.path, isDirectory: i.isDirectory })),
                    );
                } else {
                    // Fallback: delete one by one
                    for (const item of items) {
                        await onDelete(item.path, item.isDirectory);
                    }
                }

                // Clear selection after delete
                setSelectedPaths(new Set());
                onRefresh();
            } catch (error: any) {
                console.error('Failed to delete:', error);
            }
        },
        [onDelete, onDeleteMultiple, onRefresh],
    );

    // Request delete confirmation via callback
    const requestDelete = useCallback(
        async (items: SelectedItem[]) => {
            if (items.length === 0) return;

            if (onRequestDeleteConfirm) {
                const confirmed = await onRequestDeleteConfirm(items);
                if (confirmed) {
                    await executeDelete(items);
                }
            } else {
                // Fallback: delete without confirmation if no callback provided
                await executeDelete(items);
            }
        },
        [onRequestDeleteConfirm, executeDelete],
    );

    // Handle keyboard events (Delete key)
    const handleKeyDown = useCallback(
        async (e: KeyboardEvent) => {
            if (e.key === 'Delete' && selectedPaths.size > 0 && !renamingPath && !creatingItem) {
                e.preventDefault();

                // Get info for all selected items
                const items: SelectedItem[] = [];
                selectedPaths.forEach((path) => {
                    const info = getItemInfo(path, files);
                    if (info) items.push(info);
                });

                if (items.length > 0) {
                    await requestDelete(items);
                }
            }
        },
        [selectedPaths, files, renamingPath, creatingItem, requestDelete],
    );

    // Attach keyboard listener
    useEffect(() => {
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [handleKeyDown]);

    const startCreateFile = useCallback(
        (parentPath?: string) => {
            const targetPath = parentPath || rootPath;

            if (parentPath && parentPath !== rootPath) {
                setExpandedDirs((prev) => {
                    const newExpanded = new Set(prev);
                    newExpanded.add(parentPath);
                    onExpandedDirsChange?.(Array.from(newExpanded));
                    return newExpanded;
                });
            }

            setCreatingItem({
                parentPath: targetPath,
                type: 'file',
                tempId: `temp-file-${Date.now()}`,
            });
            closeContextMenu();
        },
        [rootPath, onExpandedDirsChange, closeContextMenu],
    );

    const startCreateDirectory = useCallback(
        (parentPath?: string) => {
            const targetPath = parentPath || rootPath;

            if (parentPath && parentPath !== rootPath) {
                setExpandedDirs((prev) => {
                    const newExpanded = new Set(prev);
                    newExpanded.add(parentPath);
                    onExpandedDirsChange?.(Array.from(newExpanded));
                    return newExpanded;
                });
            }

            setCreatingItem({
                parentPath: targetPath,
                type: 'directory',
                tempId: `temp-dir-${Date.now()}`,
            });
            closeContextMenu();
        },
        [rootPath, onExpandedDirsChange, closeContextMenu],
    );

    const handleCreateItem = useCallback(
        async (name: string) => {
            if (!creatingItem) return;

            let finalName = name.trim();
            if (!finalName) {
                finalName = creatingItem.type === 'file' ? 'New note.md' : 'New directory';
            } else if (creatingItem.type === 'file') {
                // Always enforce .md extension for new files
                // If user typed extension, replace it or append .md?
                // User said "só possibilite a criação de arquivos markdown".
                // So even if they type "test.txt", it should probably be "test.txt.md" or "test.md"
                // Let's assume we just append .md if it's not there.
                if (!finalName.endsWith('.md')) {
                    finalName += '.md';
                }
            }

            try {
                if (creatingItem.type === 'file') {
                    await onCreateFile(`${creatingItem.parentPath}/${finalName}`);
                } else {
                    await onCreateDirectory(`${creatingItem.parentPath}/${finalName}`);
                }
                onRefresh();
                setCreatingItem(null);
            } catch (error: any) {
                console.error('Failed to create item:', error);
                setCreatingItem(null);
            }
        },
        [creatingItem, onCreateFile, onCreateDirectory, onRefresh],
    );

    const startRename = useCallback(
        (path: string) => {
            setRenamingPath(path);
            closeContextMenu();
        },
        [closeContextMenu],
    );

    const handleRename = useCallback(
        async (oldPath: string, newName: string) => {
            const trimmedName = newName.trim();
            const oldName = oldPath.split('/').pop() || '';

            if (!trimmedName || trimmedName === oldName) {
                setRenamingPath(null);
                return;
            }

            try {
                await onRename(oldPath, trimmedName);
                onRefresh();
                setRenamingPath(null);
            } catch (error: any) {
                console.error('Failed to rename:', error);
                setRenamingPath(null);
            }
        },
        [onRename, onRefresh],
    );

    const deleteFromContextMenu = useCallback(
        async (path: string, _isDirectory: boolean) => {
            // If multiple items selected and this is one of them, delete all
            if (selectedPaths.size > 1 && selectedPaths.has(path)) {
                const items: SelectedItem[] = [];
                selectedPaths.forEach((p) => {
                    const info = getItemInfo(p, files);
                    if (info) items.push(info);
                });
                await requestDelete(items);
            } else {
                // Delete single item
                const info = getItemInfo(path, files);
                if (info) {
                    await requestDelete([info]);
                }
            }
            closeContextMenu();
        },
        [selectedPaths, files, closeContextMenu, requestDelete],
    );

    const handleContextMenu = useCallback(
        async (e: React.MouseEvent, path: string, isDirectory: boolean) => {
            e.preventDefault();
            e.stopPropagation();

            // If right-clicking on a selected item, keep the selection
            // Otherwise, select only this item
            if (!selectedPaths.has(path)) {
                setSelectedPaths(new Set([path]));
            }

            // Try native menu first
            if (native.supportsModule('menu')) {
                const fileName = path.split('/').pop() || '';
                const currentSelectionCount = selectedPaths.has(path) ? selectedPaths.size : 1;

                const items: MenuItem[] = [
                    {
                        id: 'new-file',
                        type: 'normal',
                        text: 'New File',
                        action: () => startCreateFile(isDirectory ? path : undefined),
                    },
                    {
                        id: 'new-folder',
                        type: 'normal',
                        text: 'New Folder',
                        action: () => startCreateDirectory(isDirectory ? path : undefined),
                    },
                    { type: 'separator' },
                    {
                        id: 'rename',
                        type: 'normal',
                        text: 'Rename',
                        action: () => startRename(path),
                    },
                ];

                // Add bookmark option for files only
                if (!isDirectory) {
                    items.push({
                        id: 'add-bookmark',
                        type: 'normal',
                        text: 'Add to Bookmarks',
                        action: () => {
                            setBookmarkFilePath(path);
                            setBookmarkFileName(fileName);
                            setBookmarkModalOpen(true);
                        },
                    });
                }

                // Move To...
                if (onMoveTo) {
                    items.push({
                        id: 'move-to',
                        type: 'normal',
                        text: 'Move To...',
                        action: () => onMoveTo(path),
                    });
                }

                // Make a Copy
                if (onCopyFile) {
                    items.push({
                        id: 'copy-file',
                        type: 'normal',
                        text: 'Make a Copy',
                        action: () => onCopyFile(path),
                    });
                }

                // Delete
                items.push({
                    id: 'delete',
                    type: 'normal',
                    text:
                        currentSelectionCount > 1 && selectedPaths.has(path)
                            ? `Delete (${currentSelectionCount})`
                            : 'Delete',
                    action: () => deleteFromContextMenu(path, isDirectory),
                });

                items.push({ type: 'separator' });

                // Copy Path
                if (onCopyPath) {
                    items.push({
                        id: 'copy-path',
                        type: 'normal',
                        text: 'Copy Path',
                        action: () => onCopyPath(path),
                    });
                }

                // Copy Relative Path
                if (onCopyRelativePath) {
                    items.push({
                        id: 'copy-relative-path',
                        type: 'normal',
                        text: 'Copy Relative Path',
                        action: () => onCopyRelativePath(path),
                    });
                }

                // Show in Explorer
                if (onShowInExplorer) {
                    items.push({
                        id: 'show-in-explorer',
                        type: 'normal',
                        text: 'Show in System Explorer',
                        action: () => onShowInExplorer(path),
                    });
                }

                // Sync options
                if (onToggleSyncIgnore && isSyncIgnored) {
                    items.push({ type: 'separator' });
                    if (isSyncIgnored(path)) {
                        items.push({
                            id: 'include-in-sync',
                            type: 'normal',
                            text: 'Include in Sync',
                            action: () => onToggleSyncIgnore(path, false),
                        });
                    } else {
                        items.push({
                            id: 'exclude-from-sync',
                            type: 'normal',
                            text: 'Exclude from Sync',
                            action: () => onToggleSyncIgnore(path, true),
                        });
                    }
                }

                await native.menu?.showContextMenu({
                    items,
                    position: { x: e.clientX, y: e.clientY },
                });
            } else {
                // Fall back to React menu
                setContextMenu({ x: e.clientX, y: e.clientY, path, isDirectory });
            }
        },
        [
            selectedPaths,
            onMoveTo,
            onCopyFile,
            onCopyPath,
            onCopyRelativePath,
            onShowInExplorer,
            onToggleSyncIgnore,
            isSyncIgnored,
            startCreateFile,
            startCreateDirectory,
            startRename,
            deleteFromContextMenu,
        ],
    );

    // Drag handlers with multi-select support
    const handleDragStart = useCallback(
        (e: React.DragEvent, path: string) => {
            e.stopPropagation();

            // If dragging a selected item, drag all selected items
            // Otherwise, drag only the clicked item
            let pathsToDrag: Set<string>;
            if (selectedPaths.has(path) && selectedPaths.size > 1) {
                pathsToDrag = new Set(selectedPaths);
            } else {
                pathsToDrag = new Set([path]);
                // Also update selection to show what's being dragged
                setSelectedPaths(new Set([path]));
            }

            setDraggedPaths(pathsToDrag);
            e.dataTransfer.effectAllowed = 'move';
            // Store paths as JSON for multi-item support
            e.dataTransfer.setData('application/json', JSON.stringify(Array.from(pathsToDrag)));
            e.dataTransfer.setData('text/plain', path); // Fallback
        },
        [selectedPaths],
    );

    const handleDragEnd = useCallback(() => {
        setDraggedPaths(new Set());
        setDragOverPath(null);
    }, []);

    const handleDragOver = useCallback((e: React.DragEvent, targetPath?: string) => {
        e.preventDefault();
        e.stopPropagation();
        e.dataTransfer.dropEffect = 'move';
        if (targetPath !== undefined) {
            setDragOverPath(targetPath);
        }
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        const relatedTarget = e.relatedTarget as HTMLElement;
        if (!relatedTarget || !e.currentTarget.contains(relatedTarget)) {
            setDragOverPath(null);
        }
    }, []);

    const handleDrop = useCallback(
        async (e: React.DragEvent, targetPath: string) => {
            e.preventDefault();
            e.stopPropagation();

            // Try to get multiple paths from JSON, fallback to single path
            let sourcePaths: string[] = [];
            try {
                const jsonData = e.dataTransfer.getData('application/json');
                if (jsonData) {
                    sourcePaths = JSON.parse(jsonData);
                }
            } catch {
                // Fallback to text/plain
            }

            if (sourcePaths.length === 0) {
                const singlePath = e.dataTransfer.getData('text/plain');
                if (singlePath) {
                    sourcePaths = [singlePath];
                }
            }

            setDraggedPaths(new Set());
            setDragOverPath(null);

            if (sourcePaths.length === 0) return;

            // Filter out invalid moves
            const validPaths = sourcePaths.filter((sourcePath) => {
                if (sourcePath === targetPath) return false;
                if (targetPath.startsWith(`${sourcePath}/`)) return false;
                return true;
            });

            if (validPaths.length === 0) return;

            try {
                if (validPaths.length === 1) {
                    await onMove(validPaths[0], targetPath);
                } else if (onMoveMultiple) {
                    await onMoveMultiple(validPaths, targetPath);
                } else {
                    // Fallback: move one by one
                    for (const path of validPaths) {
                        await onMove(path, targetPath);
                    }
                }
                onRefresh();
            } catch (error: any) {
                console.error('Failed to move:', error);
            }
        },
        [onMove, onMoveMultiple, onRefresh],
    );

    // Handle right-click on root area (files view)
    const handleRootContextMenu = useCallback(
        async (e: React.MouseEvent) => {
            e.preventDefault();
            e.stopPropagation();
            setSelectedPaths(new Set()); // Clear selection when clicking root

            // Try native menu first
            if (native.supportsModule('menu')) {
                const items: MenuItem[] = [
                    {
                        id: 'new-file',
                        type: 'normal',
                        text: 'New File',
                        action: () => startCreateFile(rootPath),
                    },
                    {
                        id: 'new-folder',
                        type: 'normal',
                        text: 'New Folder',
                        action: () => startCreateDirectory(rootPath),
                    },
                ];

                await native.menu?.showContextMenu({
                    items,
                    position: { x: e.clientX, y: e.clientY },
                });
            } else {
                // Fall back to React menu
                setContextMenu({
                    x: e.clientX,
                    y: e.clientY,
                    path: null,
                    isDirectory: true,
                    isRoot: true,
                });
            }
        },
        [rootPath, startCreateFile, startCreateDirectory],
    );

    // Handle right-click on bookmarks area
    const handleBookmarksContextMenu = useCallback(async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        // Try native menu first
        if (native.supportsModule('menu')) {
            const items: MenuItem[] = [
                {
                    id: 'new-bookmark-group',
                    type: 'normal',
                    text: 'New Bookmark Group',
                    action: () => setCreateGroupModalOpen(true),
                },
            ];

            await native.menu?.showContextMenu({
                items,
                position: { x: e.clientX, y: e.clientY },
            });
        } else {
            // For bookmarks, just open the modal directly
            setCreateGroupModalOpen(true);
        }
    }, []);

    // Handle drag over root area
    const handleRootDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        e.dataTransfer.dropEffect = 'move';
        setDragOverPath('__root__');
    }, []);

    const handleRootDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        const relatedTarget = e.relatedTarget as HTMLElement;
        if (!relatedTarget || !e.currentTarget.contains(relatedTarget)) {
            setDragOverPath(null);
        }
    }, []);

    // Handle drop on root area
    const handleRootDrop = useCallback(
        async (e: React.DragEvent) => {
            e.preventDefault();
            e.stopPropagation();

            let sourcePaths: string[] = [];
            try {
                const jsonData = e.dataTransfer.getData('application/json');
                if (jsonData) {
                    sourcePaths = JSON.parse(jsonData);
                }
            } catch {
                // Fallback
            }

            if (sourcePaths.length === 0) {
                const singlePath = e.dataTransfer.getData('text/plain');
                if (singlePath) {
                    sourcePaths = [singlePath];
                }
            }

            setDraggedPaths(new Set());
            setDragOverPath(null);

            if (sourcePaths.length === 0) return;

            // Filter out items already in root
            const validPaths = sourcePaths.filter((sourcePath) => {
                const sourceParent = sourcePath.substring(0, sourcePath.lastIndexOf('/'));
                return sourceParent !== rootPath;
            });

            if (validPaths.length === 0) return;

            try {
                if (validPaths.length === 1) {
                    await onMove(validPaths[0], rootPath);
                } else if (onMoveMultiple) {
                    await onMoveMultiple(validPaths, rootPath);
                } else {
                    for (const path of validPaths) {
                        await onMove(path, rootPath);
                    }
                }
                onRefresh();
            } catch (error: any) {
                console.error('Failed to move to root:', error);
            }
        },
        [rootPath, onMove, onMoveMultiple, onRefresh],
    );

    // Click on empty area to clear selection
    const handleContentClick = useCallback((e: React.MouseEvent) => {
        // Only clear if clicking directly on the content area, not on items
        if (e.target === e.currentTarget) {
            setSelectedPaths(new Set());
        }
    }, []);

    // ===== Resize handlers =====
    const handleResizeMouseDown = useCallback(
        (e: React.MouseEvent) => {
            e.preventDefault();
            setIsResizing(true);
            startXRef.current = e.clientX;
            startWidthRef.current = width;

            // Add global listeners
            const handleMouseMove = (e: MouseEvent) => {
                const diff = e.clientX - startXRef.current;
                const newWidth = Math.max(
                    minWidth,
                    Math.min(maxWidth, startWidthRef.current + diff),
                );
                onWidthChange(newWidth);
            };

            const handleMouseUp = () => {
                setIsResizing(false);
                document.removeEventListener('mousemove', handleMouseMove);
                document.removeEventListener('mouseup', handleMouseUp);
                document.body.style.cursor = '';
                document.body.style.userSelect = '';
            };

            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
            document.body.style.cursor = 'col-resize';
            document.body.style.userSelect = 'none';
        },
        [width, minWidth, maxWidth, onWidthChange],
    );

    // Double-click on resize handle to reset to default width
    const handleResizeDoubleClick = useCallback(() => {
        onWidthChange(DEFAULT_WIDTH);
    }, [onWidthChange]);

    const renderFileNode = useCallback(
        (node: FileNode, depth = 0): React.ReactNode => {
            const isExpanded = expandedDirs.has(node.path);
            const isExpanding = expandingDirs.has(node.path);
            const isSelected = selectedPaths.has(node.path);
            const isRenaming = renamingPath === node.path;
            const isDragOver = dragOverPath === node.path;
            const isBeingDragged = draggedPaths.has(node.path);

            return (
                <div key={node.path} className="file-node">
                    <div
                        className={`file-node-item ${node.isDirectory ? 'directory' : ''} ${isSelected ? 'selected' : ''} ${isDragOver ? 'drag-over' : ''} ${isBeingDragged ? 'dragging' : ''}`}
                        style={{ paddingLeft: `${depth * 16 + 8}px` }}
                        onClick={(e) => handleItemClick(node, e)}
                        onContextMenu={(e) => handleContextMenu(e, node.path, node.isDirectory)}
                        draggable={!isRenaming}
                        onDragStart={(e) => handleDragStart(e, node.path)}
                        onDragEnd={handleDragEnd}
                        onDragOver={
                            node.isDirectory
                                ? (e) => handleDragOver(e, node.path)
                                : (e) => {
                                    e.preventDefault();
                                    e.dataTransfer.dropEffect = 'none';
                                }
                        }
                        onDragLeave={node.isDirectory ? handleDragLeave : undefined}
                        onDrop={node.isDirectory ? (e) => handleDrop(e, node.path) : undefined}
                    >
                        <span className="file-node-icon">
                            {node.isDirectory &&
                                (isExpanded ? <FolderOpen size={16} /> : <Folder size={16} />)}
                        </span>

                        {isRenaming ? (
                            <input
                                type="text"
                                className="file-node-rename-input"
                                defaultValue={
                                    node.name.endsWith('.md') ? node.name.slice(0, -3) : node.name
                                }
                                autoFocus
                                onBlur={(e) => {
                                    const val = e.target.value.trim();
                                    const oldExt = node.name.includes('.')
                                        ? `.${node.name.split('.').pop()}`
                                        : '';
                                    const newName =
                                        val + (oldExt === '.md' || !oldExt ? '.md' : oldExt);
                                    handleRename(node.path, newName);
                                }}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        const val = e.currentTarget.value.trim();
                                        const oldExt = node.name.includes('.')
                                            ? `.${node.name.split('.').pop()}`
                                            : '';
                                        const newName =
                                            val + (oldExt === '.md' || !oldExt ? '.md' : oldExt);
                                        handleRename(node.path, newName);
                                    } else if (e.key === 'Escape') {
                                        setRenamingPath(null);
                                    }
                                    e.stopPropagation();
                                }}
                                onClick={(e) => e.stopPropagation()}
                            />
                        ) : (
                            <div className="file-node-name-container">
                                <span className="file-node-name">
                                    {node.name.endsWith('.md') ? node.name.slice(0, -3) : node.name}
                                </span>
                                {!node.isDirectory && !node.name.endsWith('.md') && (
                                    <span className="file-node-badge">
                                        {node.name.split('.').pop()}
                                    </span>
                                )}
                            </div>
                        )}
                    </div>

                    {node.isDirectory && isExpanded && (
                        <div className={`file-node-children ${isExpanding ? 'expanding' : ''}`}>
                            {creatingItem && creatingItem.parentPath === node.path && (
                                <div
                                    className="file-node-item creating"
                                    style={{ paddingLeft: `${(depth + 1) * 16 + 8}px` }}
                                >
                                    <span className="file-node-icon">
                                        {creatingItem.type === 'directory' && <Folder size={16} />}
                                    </span>
                                    <input
                                        type="text"
                                        className="file-node-rename-input"
                                        placeholder={
                                            creatingItem.type === 'file'
                                                ? 'New note.md'
                                                : 'New directory'
                                        }
                                        autoFocus
                                        onBlur={(e) => handleCreateItem(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                handleCreateItem(e.currentTarget.value);
                                            } else if (e.key === 'Escape') {
                                                setCreatingItem(null);
                                            }
                                            e.stopPropagation();
                                        }}
                                        onClick={(e) => e.stopPropagation()}
                                    />
                                </div>
                            )}
                            {node.children?.map((child: FileNode) =>
                                renderFileNode(child, depth + 1),
                            )}
                        </div>
                    )}
                </div>
            );
        },
        [
            expandedDirs,
            expandingDirs,
            selectedPaths,
            renamingPath,
            dragOverPath,
            draggedPaths,
            creatingItem,
            handleItemClick,
            handleContextMenu,
            handleDragStart,
            handleDragEnd,
            handleDragOver,
            handleDragLeave,
            handleDrop,
            handleRename,
            handleCreateItem,
        ],
    );

    // Render bookmark group as folder
    const renderBookmarkGroup = useCallback(
        (group: BookmarkGroup) => {
            const isExpanded = expandedBookmarkGroups.has(group.id);

            return (
                <div key={group.id} className="file-node">
                    <div
                        className="file-node-item directory bookmark-group"
                        style={{ paddingLeft: '8px' }}
                        onClick={() => {
                            setExpandedBookmarkGroups((prev) => {
                                const next = new Set(prev);
                                if (next.has(group.id)) {
                                    next.delete(group.id);
                                } else {
                                    next.add(group.id);
                                }
                                return next;
                            });
                        }}
                    >
                        {group.color && (
                            <span
                                className="bookmark-group-color-indicator"
                                style={{ backgroundColor: group.color }}
                            />
                        )}
                        <span className="file-node-icon">
                            {isExpanded ? <FolderOpen size={16} /> : <Folder size={16} />}
                        </span>
                        <span className="file-node-name">{group.name}</span>
                        <span className="file-node-count">({group.bookmarks.length})</span>
                    </div>
                    {isExpanded && (
                        <div className="file-node-children">
                            {group.bookmarks.map((bookmark) => (
                                <div key={bookmark.id} className="file-node">
                                    <div
                                        className={`file-node-item ${activeFilePath === bookmark.filePath ? 'active' : ''}`}
                                        style={{ paddingLeft: '32px' }}
                                        onClick={() => onFileSelect(bookmark.filePath)}
                                        title={bookmark.filePath}
                                    >
                                        <span className="file-node-icon">
                                            <File size={16} />
                                        </span>
                                        <span className="file-node-name">{bookmark.title}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            );
        },
        [expandedBookmarkGroups, activeFilePath, onFileSelect],
    );

    // Selection count for status/context
    const selectionCount = selectedPaths.size;

    return (
        <div
            ref={containerRef}
            className={`file-explorer-sidebar ${isCollapsed ? 'collapsed' : ''} ${isResizing ? 'resizing' : ''}`}
            style={{
                width: isCollapsed ? 0 : width,
                minWidth: isCollapsed ? 0 : minWidth,
            }}
            tabIndex={-1}
        >
            {!isCollapsed && (
                <>
                    <div className="file-explorer">
                        <div
                            className={`file-explorer-header ${useCustomTitleBar && isMacOS ? 'with-traffic-lights' : ''}`}
                        >
                            {/* Main header row - workspace + settings */}
                            <div className="file-explorer-header-main" data-tauri-drag-region>
                                <div className="file-explorer-header-workspace">
                                    <WorkspaceSwitcher
                                        currentWorkspace={rootPath}
                                        recentWorkspaces={recentWorkspaces}
                                        onSelect={onWorkspaceSwitch || (() => { })}
                                        onBrowse={onBrowseWorkspace || (() => { })}
                                    />
                                </div>
                                <div className="file-explorer-header-actions">
                                    <button
                                        type="button"
                                        className={`file-explorer-action ${viewMode === 'bookmarks' ? 'active' : ''}`}
                                        onClick={() =>
                                            setViewMode(
                                                viewMode === 'files' ? 'bookmarks' : 'files',
                                            )
                                        }
                                        title={
                                            viewMode === 'files' ? 'Show Bookmarks' : 'Show Files'
                                        }
                                    >
                                        <Bookmark size={16} />
                                    </button>
                                    {onOpenSettings && (
                                        <button
                                            type="button"
                                            className="file-explorer-action"
                                            onClick={onOpenSettings}
                                            title="Settings"
                                        >
                                            <Settings size={16} />
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Toolbar row - file/bookmark actions */}
                            <div className="file-explorer-toolbar">
                                {viewMode === 'files' ? (
                                    <>
                                        <div className="file-explorer-toolbar-group">
                                            <button
                                                type="button"
                                                className="file-explorer-action"
                                                onClick={() => startCreateFile()}
                                                title="New File"
                                            >
                                                <Plus size={16} />
                                            </button>
                                            <button
                                                type="button"
                                                className="file-explorer-action"
                                                onClick={() => startCreateDirectory()}
                                                title="New Folder"
                                            >
                                                <FolderPlus size={16} />
                                            </button>
                                        </div>
                                        <div className="file-explorer-toolbar-separator" />
                                        <div className="file-explorer-toolbar-group">
                                            <div
                                                className="file-explorer-sort-container"
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                <button
                                                    type="button"
                                                    className={`file-explorer-action ${sortOrder !== 'a-z' ? 'active' : ''}`}
                                                    onClick={handleSortButtonClick}
                                                    title="Sort Options"
                                                >
                                                    {sortOrder === 'a-z' ? (
                                                        <ArrowDownAZ size={16} />
                                                    ) : (
                                                        <ArrowUpAZ size={16} />
                                                    )}
                                                </button>
                                                {!native.supportsModule('menu') && sortMenuOpen && (
                                                    <div className="file-explorer-sort-menu">
                                                        <div
                                                            className="file-explorer-sort-item"
                                                            onClick={() => handleSortChange('a-z')}
                                                        >
                                                            <span>Name (A to Z)</span>
                                                            {sortOrder === 'a-z' && (
                                                                <Check size={16} />
                                                            )}
                                                        </div>
                                                        <div
                                                            className="file-explorer-sort-item"
                                                            onClick={() => handleSortChange('z-a')}
                                                        >
                                                            <span>Name (Z to A)</span>
                                                            {sortOrder === 'z-a' && (
                                                                <Check size={16} />
                                                            )}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                            <button
                                                type="button"
                                                className="file-explorer-action"
                                                onClick={handleExpandCollapseAll}
                                                title={
                                                    allDirsExpanded ? 'Collapse All' : 'Expand All'
                                                }
                                            >
                                                {allDirsExpanded ? (
                                                    <ChevronsUp size={16} />
                                                ) : (
                                                    <ChevronsDown size={16} />
                                                )}
                                            </button>
                                        </div>
                                    </>
                                ) : (
                                    <div className="file-explorer-toolbar-group">
                                        <button
                                            type="button"
                                            className="file-explorer-action"
                                            onClick={() => setCreateGroupModalOpen(true)}
                                            title="New Bookmark Group"
                                        >
                                            <FolderPlus size={16} />
                                        </button>
                                        <button
                                            type="button"
                                            className="file-explorer-action"
                                            onClick={handleExpandCollapseAllBookmarks}
                                            title={
                                                allBookmarkGroupsExpanded
                                                    ? 'Collapse All'
                                                    : 'Expand All'
                                            }
                                        >
                                            {allBookmarkGroupsExpanded ? (
                                                <ChevronsUp size={16} />
                                            ) : (
                                                <ChevronsDown size={16} />
                                            )}
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div
                            className={`file-explorer-content ${dragOverPath === '__root__' ? 'drag-over' : ''}`}
                            onClick={handleContentClick}
                            onContextMenu={
                                viewMode === 'files'
                                    ? handleRootContextMenu
                                    : handleBookmarksContextMenu
                            }
                            onDragOver={viewMode === 'files' ? handleRootDragOver : undefined}
                            onDragLeave={viewMode === 'files' ? handleRootDragLeave : undefined}
                            onDrop={viewMode === 'files' ? handleRootDrop : undefined}
                        >
                            {viewMode === 'files' &&
                                creatingItem &&
                                creatingItem.parentPath === rootPath && (
                                    <div className="file-node">
                                        <div
                                            className="file-node-item creating"
                                            style={{ paddingLeft: '8px' }}
                                        >
                                            <span className="file-node-icon">
                                                {creatingItem.type === 'directory' ? (
                                                    <Folder size={16} />
                                                ) : (
                                                    <File size={16} />
                                                )}
                                            </span>
                                            <input
                                                type="text"
                                                className="file-node-rename-input"
                                                placeholder={
                                                    creatingItem.type === 'file'
                                                        ? 'New note.md'
                                                        : 'New directory'
                                                }
                                                autoFocus
                                                onBlur={(e) => handleCreateItem(e.target.value)}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') {
                                                        handleCreateItem(e.currentTarget.value);
                                                    } else if (e.key === 'Escape') {
                                                        setCreatingItem(null);
                                                    }
                                                    e.stopPropagation();
                                                }}
                                                onClick={(e) => e.stopPropagation()}
                                            />
                                        </div>
                                    </div>
                                )}
                            {viewMode === 'files' ? (
                                sortedFiles.map((node) => renderFileNode(node, 0))
                            ) : bookmarkGroups.length > 0 ? (
                                bookmarkGroups.map((group) => renderBookmarkGroup(group))
                            ) : (
                                <div className="file-explorer-empty">
                                    <Bookmark size={48} />
                                    <p>No bookmarks yet</p>
                                    <p className="text-muted">
                                        Add bookmarks from the context menu or editor options
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Fallback React context menu when native menus not supported */}
                        {!native.supportsModule('menu') && contextMenu && (
                            <div
                                className="context-menu"
                                style={{ left: contextMenu.x, top: contextMenu.y }}
                                onClick={(e) => e.stopPropagation()}
                            >
                                <button
                                    type="button"
                                    className="context-menu-item"
                                    onClick={() =>
                                        startCreateFile(
                                            contextMenu.isRoot
                                                ? rootPath
                                                : contextMenu.isDirectory
                                                    ? contextMenu.path!
                                                    : undefined,
                                        )
                                    }
                                >
                                    <Plus size={14} />
                                    New File
                                </button>
                                <button
                                    type="button"
                                    className="context-menu-item"
                                    onClick={() =>
                                        startCreateDirectory(
                                            contextMenu.isRoot
                                                ? rootPath
                                                : contextMenu.isDirectory
                                                    ? contextMenu.path!
                                                    : undefined,
                                        )
                                    }
                                >
                                    <FolderPlus size={14} />
                                    New Folder
                                </button>
                                {!contextMenu.isRoot && contextMenu.path && (
                                    <>
                                        <div className="context-menu-separator" />
                                        <button
                                            type="button"
                                            className="context-menu-item"
                                            onClick={() => {
                                                startRename(contextMenu.path!);
                                                closeContextMenu();
                                            }}
                                        >
                                            <Edit2 size={14} />
                                            Rename
                                        </button>
                                        {!contextMenu.isDirectory && (
                                            <button
                                                type="button"
                                                className="context-menu-item"
                                                onClick={() => {
                                                    const fileName =
                                                        contextMenu.path?.split('/').pop() || '';
                                                    setBookmarkFilePath(contextMenu.path!);
                                                    setBookmarkFileName(fileName);
                                                    setBookmarkModalOpen(true);
                                                    closeContextMenu();
                                                }}
                                            >
                                                <Bookmark size={14} />
                                                Add to Bookmarks
                                            </button>
                                        )}
                                        {onMoveTo && (
                                            <button
                                                type="button"
                                                className="context-menu-item"
                                                onClick={() => {
                                                    onMoveTo(contextMenu.path!);
                                                    closeContextMenu();
                                                }}
                                            >
                                                <FolderInput size={14} />
                                                Move To...
                                            </button>
                                        )}
                                        {onCopyFile && (
                                            <button
                                                type="button"
                                                className="context-menu-item"
                                                onClick={() => {
                                                    onCopyFile(contextMenu.path!);
                                                    closeContextMenu();
                                                }}
                                            >
                                                <Copy size={14} />
                                                Make a Copy
                                            </button>
                                        )}
                                        <button
                                            type="button"
                                            className="context-menu-item danger"
                                            onClick={() =>
                                                deleteFromContextMenu(
                                                    contextMenu.path!,
                                                    contextMenu.isDirectory,
                                                )
                                            }
                                        >
                                            <Trash2 size={14} />
                                            Delete
                                            {selectionCount > 1 &&
                                                selectedPaths.has(contextMenu.path!)
                                                ? ` (${selectionCount})`
                                                : ''}
                                        </button>
                                        <div className="context-menu-separator" />
                                        {onCopyPath && (
                                            <button
                                                type="button"
                                                className="context-menu-item"
                                                onClick={() => {
                                                    onCopyPath(contextMenu.path!);
                                                    closeContextMenu();
                                                }}
                                            >
                                                <Clipboard size={14} />
                                                Copy Path
                                            </button>
                                        )}
                                        {onCopyRelativePath && (
                                            <button
                                                type="button"
                                                className="context-menu-item"
                                                onClick={() => {
                                                    onCopyRelativePath(contextMenu.path!);
                                                    closeContextMenu();
                                                }}
                                            >
                                                <Link size={14} />
                                                Copy Relative Path
                                            </button>
                                        )}
                                        {onShowInExplorer && (
                                            <button
                                                type="button"
                                                className="context-menu-item"
                                                onClick={() => {
                                                    onShowInExplorer(contextMenu.path!);
                                                    closeContextMenu();
                                                }}
                                            >
                                                <ExternalLink size={14} />
                                                Show in System Explorer
                                            </button>
                                        )}
                                        {onToggleSyncIgnore && isSyncIgnored && (
                                            <>
                                                <div className="context-menu-separator" />
                                                {isSyncIgnored(contextMenu.path!) ? (
                                                    <button
                                                        type="button"
                                                        className="context-menu-item"
                                                        onClick={() => {
                                                            onToggleSyncIgnore(
                                                                contextMenu.path!,
                                                                false,
                                                            );
                                                            closeContextMenu();
                                                        }}
                                                    >
                                                        <Cloud size={14} />
                                                        Include in Sync
                                                    </button>
                                                ) : (
                                                    <button
                                                        type="button"
                                                        className="context-menu-item"
                                                        onClick={() => {
                                                            onToggleSyncIgnore(
                                                                contextMenu.path!,
                                                                true,
                                                            );
                                                            closeContextMenu();
                                                        }}
                                                    >
                                                        <CloudOff size={14} />
                                                        Exclude from Sync
                                                    </button>
                                                )}
                                            </>
                                        )}
                                    </>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Resize handle */}
                    <div
                        className="file-explorer-resize-handle"
                        onMouseDown={handleResizeMouseDown}
                        onDoubleClick={handleResizeDoubleClick}
                        title="Drag to resize, double-click to reset"
                    />
                </>
            )}

            {/* Bookmark Modal */}
            <BookmarkGroupModal
                isOpen={bookmarkModalOpen}
                onClose={() => setBookmarkModalOpen(false)}
                filePath={bookmarkFilePath}
                fileName={bookmarkFileName}
            />

            {/* Create Bookmark Group Modal */}
            <CreateBookmarkGroupModal
                isOpen={createGroupModalOpen}
                onClose={() => setCreateGroupModalOpen(false)}
                onCreate={(name, description, color) => {
                    app.bookmarkManager.createGroup(name, description, color);
                }}
            />
        </div>
    );
};
