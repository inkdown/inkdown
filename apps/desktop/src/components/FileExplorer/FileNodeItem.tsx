import type { FileNode } from '@inkdown/core';
import { File, Folder, FolderOpen } from 'lucide-react';
import type React from 'react';
import { memo } from 'react';

interface FileNodeItemProps {
    node: FileNode;
    depth: number;
    isExpanded: boolean;
    isExpanding: boolean;
    isSelected: boolean;
    isRenaming: boolean;
    isDragOver: boolean;
    isBeingDragged: boolean;
    onClick: (e: React.MouseEvent) => void;
    onContextMenu: (e: React.MouseEvent) => void;
    onDragStart: (e: React.DragEvent) => void;
    onDragEnd: () => void;
    onDragOver: (e: React.DragEvent) => void;
    onDragLeave?: () => void;
    onDrop?: (e: React.DragEvent) => void;
    onRename: (newName: string) => void;
}

export const FileNodeItem = memo<FileNodeItemProps>(
    ({
        node,
        depth,
        isExpanded,
        isSelected,
        isRenaming,
        isDragOver,
        isBeingDragged,
        onClick,
        onContextMenu,
        onDragStart,
        onDragEnd,
        onDragOver,
        onDragLeave,
        onDrop,
        onRename,
    }) => {
        return (
            <div
                className={`file-node-item ${node.isDirectory ? 'directory' : ''} ${isSelected ? 'selected' : ''} ${isDragOver ? 'drag-over' : ''} ${isBeingDragged ? 'dragging' : ''}`}
                style={{ paddingLeft: `${depth * 16 + 8}px` }}
                onClick={onClick}
                onContextMenu={onContextMenu}
                draggable={!isRenaming}
                onDragStart={onDragStart}
                onDragEnd={onDragEnd}
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
                onDrop={onDrop}
            >
                <span className="file-node-icon">
                    {node.isDirectory &&
                        (isExpanded ? <FolderOpen size={16} /> : <Folder size={16} />)}
                    {!node.isDirectory && <File size={16} />}
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
                            const newExt = node.isDirectory ? '' : oldExt;
                            onRename(val ? val + newExt : node.name);
                        }}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                const val = (e.target as HTMLInputElement).value.trim();
                                const oldExt = node.name.includes('.')
                                    ? `.${node.name.split('.').pop()}`
                                    : '';
                                const newExt = node.isDirectory ? '' : oldExt;
                                onRename(val ? val + newExt : node.name);
                            } else if (e.key === 'Escape') {
                                onRename(node.name);
                            }
                            e.stopPropagation();
                        }}
                        onClick={(e) => e.stopPropagation()}
                    />
                ) : (
                    <span className="file-node-name">
                        {node.isDirectory
                            ? node.name
                            : node.name.endsWith('.md')
                              ? node.name.slice(0, -3)
                              : node.name}
                    </span>
                )}
            </div>
        );
    },
);

FileNodeItem.displayName = 'FileNodeItem';
