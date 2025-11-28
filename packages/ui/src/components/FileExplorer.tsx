import type { FileNode } from '@inkdown/core';
import { Edit2, File, Folder, FolderOpen, FolderPlus, Plus, Trash2 } from 'lucide-react';
import type React from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';
import '../styles/FileExplorer.css';

export type SelectedItem = {
    path: string;
    isDirectory: boolean;
    name: string;
};

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
    /** Callback to request delete confirmation (for native dialogs) */
    onRequestDeleteConfirm?: (items: SelectedItem[]) => Promise<boolean>;
    onRefresh: () => void;
}

type CreatingItem = {
    parentPath: string;
    type: 'file' | 'directory';
    tempId: string;
};

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
    onRequestDeleteConfirm,
    onRefresh,
}) => {
    const [expandedDirs, setExpandedDirs] = useState<Set<string>>(() => {
        return new Set(initialExpandedDirs || []);
    });
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
    }, [activeFilePath]);

    const toggleDirectory = useCallback(
        (path: string) => {
            setExpandedDirs((prev) => {
                const newExpanded = new Set(prev);
                if (newExpanded.has(path)) {
                    newExpanded.delete(path);
                } else {
                    newExpanded.add(path);
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
            } else {
                // For files: handle selection and open
                if (isCtrlClick) {
                    // Ctrl+click: toggle selection without opening
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
                    // Regular click: select and open
                    setSelectedPaths(new Set([node.path]));
                    const shouldOpenInNewTab = isDoubleClick;
                    onFileSelect(node.path, shouldOpenInNewTab);
                }
            }
        },
        [lastClickPath, lastClickTime, toggleDirectory, onFileSelect],
    );

    const handleContextMenu = useCallback(
        (e: React.MouseEvent, path: string, isDirectory: boolean) => {
            e.preventDefault();
            e.stopPropagation();

            // If right-clicking on a selected item, keep the selection
            // Otherwise, select only this item
            if (!selectedPaths.has(path)) {
                setSelectedPaths(new Set([path]));
            }

            setContextMenu({ x: e.clientX, y: e.clientY, path, isDirectory });
        },
        [selectedPaths],
    );

    const closeContextMenu = useCallback(() => {
        setContextMenu(null);
    }, []);

    // Close context menu on click outside
    useEffect(() => {
        const handleClick = () => closeContextMenu();
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
            } catch (error) {
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
            } else if (creatingItem.type === 'file' && !finalName.endsWith('.md')) {
                finalName += '.md';
            }

            try {
                if (creatingItem.type === 'file') {
                    await onCreateFile(creatingItem.parentPath + '/' + finalName);
                } else {
                    await onCreateDirectory(creatingItem.parentPath + '/' + finalName);
                }
                onRefresh();
                setCreatingItem(null);
            } catch (error) {
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
            } catch (error) {
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
                if (targetPath.startsWith(sourcePath + '/')) return false;
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
            } catch (error) {
                console.error('Failed to move:', error);
            }
        },
        [onMove, onMoveMultiple, onRefresh],
    );

    // Handle right-click on root area
    const handleRootContextMenu = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setSelectedPaths(new Set()); // Clear selection when clicking root
        setContextMenu({ x: e.clientX, y: e.clientY, path: null, isDirectory: true, isRoot: true });
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
            } catch (error) {
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

    const renderFileNode = useCallback(
        (node: FileNode, depth = 0): React.ReactNode => {
            const isExpanded = expandedDirs.has(node.path);
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
                        onDoubleClick={(e) => e.preventDefault()}
                        onMouseDown={(e) => {
                            if (e.detail > 1) {
                                e.preventDefault();
                            }
                        }}
                        onContextMenu={(e) => handleContextMenu(e, node.path, node.isDirectory)}
                        tabIndex={0}
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
                            {node.isDirectory ? (
                                isExpanded ? (
                                    <FolderOpen size={16} />
                                ) : (
                                    <Folder size={16} />
                                )
                            ) : (
                                <File size={16} />
                            )}
                        </span>

                        {isRenaming ? (
                            <input
                                type="text"
                                className="file-node-rename-input"
                                defaultValue={node.name}
                                autoFocus
                                onBlur={(e) => handleRename(node.path, e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        handleRename(node.path, e.currentTarget.value);
                                    } else if (e.key === 'Escape') {
                                        setRenamingPath(null);
                                    }
                                    e.stopPropagation();
                                }}
                                onClick={(e) => e.stopPropagation()}
                            />
                        ) : (
                            <span className="file-node-name">{node.name}</span>
                        )}
                    </div>

                    {node.isDirectory && isExpanded && (
                        <div className="file-node-children">
                            {creatingItem && creatingItem.parentPath === node.path && (
                                <div
                                    className="file-node-item creating"
                                    style={{ paddingLeft: `${(depth + 1) * 16 + 8}px` }}
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
                            )}
                            {node.children &&
                                node.children.map((child: FileNode) =>
                                    renderFileNode(child, depth + 1),
                                )}
                        </div>
                    )}
                </div>
            );
        },
        [
            expandedDirs,
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

    // Selection count for status/context
    const selectionCount = selectedPaths.size;

    return (
        <div className="file-explorer" ref={containerRef} tabIndex={-1}>
            <div className="file-explorer-header">
                <h3>Files</h3>
                <div className="file-explorer-actions">
                    <button
                        className="file-explorer-action"
                        onClick={() => startCreateFile()}
                        title="New File"
                    >
                        <Plus size={16} />
                    </button>
                    <button
                        className="file-explorer-action"
                        onClick={() => startCreateDirectory()}
                        title="New Folder"
                    >
                        <FolderPlus size={16} />
                    </button>
                </div>
            </div>

            <div
                className={`file-explorer-content ${dragOverPath === '__root__' ? 'drag-over' : ''}`}
                onClick={handleContentClick}
                onContextMenu={handleRootContextMenu}
                onDragOver={handleRootDragOver}
                onDragLeave={handleRootDragLeave}
                onDrop={handleRootDrop}
            >
                {creatingItem && creatingItem.parentPath === rootPath && (
                    <div className="file-node">
                        <div className="file-node-item creating" style={{ paddingLeft: '8px' }}>
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
                                    creatingItem.type === 'file' ? 'New note.md' : 'New directory'
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
                {files.map((node) => renderFileNode(node, 0))}
            </div>

            {contextMenu && (
                <div
                    className="context-menu"
                    style={{ left: contextMenu.x, top: contextMenu.y }}
                    onClick={(e) => e.stopPropagation()}
                >
                    <button
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
                                className="context-menu-item"
                                onClick={() => startRename(contextMenu.path!)}
                            >
                                <Edit2 size={14} />
                                Rename
                            </button>
                            <button
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
                                {selectionCount > 1 && selectedPaths.has(contextMenu.path!)
                                    ? ` (${selectionCount})`
                                    : ''}
                            </button>
                        </>
                    )}
                </div>
            )}
        </div>
    );
};
