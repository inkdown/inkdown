import type { BookmarkGroup } from '@inkdown/core';
import { Bookmark, Folder, FolderOpen } from 'lucide-react';
import { memo } from 'react';

interface BookmarkListProps {
    groups: BookmarkGroup[];
    expandedGroups: Set<string>;
    activeFilePath?: string | null;
    onToggleGroup: (groupId: string) => void;
    onSelectBookmark: (filePath: string) => void;
}

export const BookmarkList = memo<BookmarkListProps>(
    ({ groups, expandedGroups, activeFilePath, onToggleGroup, onSelectBookmark }) => {
        if (groups.length === 0) {
            return (
                <div className="file-explorer-empty">
                    <Bookmark size={48} />
                    <p>No bookmarks yet</p>
                    <p className="text-muted">
                        Add bookmarks from the context menu or editor options
                    </p>
                </div>
            );
        }

        return (
            <>
                {groups.map((group) => {
                    const isExpanded = expandedGroups.has(group.id);
                    return (
                        <div key={group.id} className="file-node">
                            <div
                                className="file-node-item directory"
                                style={{ paddingLeft: '8px' }}
                                onClick={() => onToggleGroup(group.id)}
                            >
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
                                                onClick={() => onSelectBookmark(bookmark.filePath)}
                                                title={bookmark.filePath}
                                            >
                                                <span className="file-node-name">
                                                    {bookmark.title}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    );
                })}
            </>
        );
    },
);

BookmarkList.displayName = 'BookmarkList';
