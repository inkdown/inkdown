import React, { memo, useCallback } from 'react';
import type { FileNode } from '@inkdown/core';
import { FileNodeItem } from './FileNodeItem';
import type { CreatingItem } from './types';
import { File, Folder } from 'lucide-react';

interface FileTreeNodeProps {
    node: FileNode;
    depth: number;
    expandedDirs: Set<string>;
    expandingDirs: Set<string>;
    selectedPaths: Set<string>;
    renamingPath: string | null;
    dragOverPath: string | null;
    draggedPaths: Set<string>;
    creatingItem: CreatingItem | null;
    onItemClick: (node: FileNode, e: React.MouseEvent) => void;
    onContextMenu: (e: React.MouseEvent, path: string, isDirectory: boolean) => void;
    onDragStart: (e: React.DragEvent, path: string) => void;
    onDragEnd: () => void;
    onDragOver: (e: React.DragEvent, path: string) => void;
    onDragLeave: () => void;
    onDrop: (e: React.DragEvent, path: string) => void;
    onRename: (path: string, newName: string) => void;
    onCreateItem: (value: string) => void;
}

export const FileTreeNode = memo<FileTreeNodeProps>(({
    node,
    depth,
    expandedDirs,
    expandingDirs,
    selectedPaths,
    renamingPath,
    dragOverPath,
    draggedPaths,
    creatingItem,
    onItemClick,
    onContextMenu,
    onDragStart,
    onDragEnd,
    onDragOver,
    onDragLeave,
    onDrop,
    onRename,
    onCreateItem,
}) => {
    const isExpanded = expandedDirs.has(node.path);
    const isExpanding = expandingDirs.has(node.path);
    const isSelected = selectedPaths.has(node.path);
    const isRenaming = renamingPath === node.path;
    const isDragOver = dragOverPath === node.path;
    const isBeingDragged = draggedPaths.has(node.path);

    const handleRename = useCallback(
        (newName: string) => {
            onRename(node.path, newName);
        },
        [node.path, onRename]
    );

    const handleDragOver = useCallback(
        (e: React.DragEvent) => {
            if (node.isDirectory) {
                onDragOver(e, node.path);
            } else {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'none';
            }
        },
        [node.isDirectory, node.path, onDragOver]
    );

    return (
        <div className="file-node">
            <FileNodeItem
                node={node}
                depth={depth}
                isExpanded={isExpanded}
                isExpanding={isExpanding}
                isSelected={isSelected}
                isRenaming={isRenaming}
                isDragOver={isDragOver}
                isBeingDragged={isBeingDragged}
                onClick={(e) => onItemClick(node, e)}
                onContextMenu={(e) => onContextMenu(e, node.path, node.isDirectory)}
                onDragStart={(e) => onDragStart(e, node.path)}
                onDragEnd={onDragEnd}
                onDragOver={handleDragOver}
                onDragLeave={node.isDirectory ? onDragLeave : undefined}
                onDrop={node.isDirectory ? (e) => onDrop(e, node.path) : undefined}
                onRename={handleRename}
            />

            {node.isDirectory && isExpanded && node.children && (
                <div className={`file-node-children ${isExpanding ? 'expanding' : ''}`}>
                    {creatingItem && creatingItem.parentPath === node.path && (
                        <div className="file-node">
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
                                    onBlur={(e) => onCreateItem(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            onCreateItem(e.currentTarget.value);
                                        } else if (e.key === 'Escape') {
                                            onCreateItem('');
                                        }
                                        e.stopPropagation();
                                    }}
                                    onClick={(e) => e.stopPropagation()}
                                />
                            </div>
                        </div>
                    )}
                    {node.children.map((child) => (
                        <FileTreeNode
                            key={child.path}
                            node={child}
                            depth={depth + 1}
                            expandedDirs={expandedDirs}
                            expandingDirs={expandingDirs}
                            selectedPaths={selectedPaths}
                            renamingPath={renamingPath}
                            dragOverPath={dragOverPath}
                            draggedPaths={draggedPaths}
                            creatingItem={creatingItem}
                            onItemClick={onItemClick}
                            onContextMenu={onContextMenu}
                            onDragStart={onDragStart}
                            onDragEnd={onDragEnd}
                            onDragOver={onDragOver}
                            onDragLeave={onDragLeave}
                            onDrop={onDrop}
                            onRename={onRename}
                            onCreateItem={onCreateItem}
                        />
                    ))}
                </div>
            )}
        </div>
    );
});

FileTreeNode.displayName = 'FileTreeNode';
