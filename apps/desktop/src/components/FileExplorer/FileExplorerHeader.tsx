import { memo } from 'react';
import { WorkspaceSwitcher } from '@inkdown/ui';
import {
    ArrowDownAZ,
    ArrowUpAZ,
    Bookmark,
    Check,
    ChevronsDown,
    ChevronsUp,
    FolderPlus,
    Plus,
    Settings,
} from 'lucide-react';
import type { RecentWorkspace } from '@inkdown/core';
import type { SortOrder } from './types.js';

interface FileExplorerHeaderProps {
    // Top section
    rootPath: string;
    recentWorkspaces: RecentWorkspace[];
    viewMode: 'files' | 'bookmarks';
    onViewModeChange: (mode: 'files' | 'bookmarks') => void;
    onOpenSettings?: () => void;
    onWorkspaceSwitch?: (path: string) => void;
    onBrowseWorkspace?: () => void;

    // Bottom section - Files mode
    sortOrder: SortOrder;
    sortMenuOpen: boolean;
    allDirsExpanded: boolean;
    onSortChange: (order: SortOrder) => void;
    onToggleSortMenu: () => void;
    onCreateFile: () => void;
    onCreateDirectory: () => void;
    onExpandCollapseAll: () => void;

    // Bottom section - Bookmarks mode
    allBookmarkGroupsExpanded: boolean;
    onCreateBookmarkGroup: () => void;
    onExpandCollapseAllBookmarks: () => void;
}

export const FileExplorerHeader = memo<FileExplorerHeaderProps>(({
    rootPath,
    recentWorkspaces,
    viewMode,
    onViewModeChange,
    onOpenSettings,
    onWorkspaceSwitch,
    onBrowseWorkspace,
    sortOrder,
    sortMenuOpen,
    allDirsExpanded,
    onSortChange,
    onToggleSortMenu,
    onCreateFile,
    onCreateDirectory,
    onExpandCollapseAll,
    allBookmarkGroupsExpanded,
    onCreateBookmarkGroup,
    onExpandCollapseAllBookmarks,
}) => {
    return (
        <div className="file-explorer-header">
            <div className="file-explorer-header-top">
                <WorkspaceSwitcher
                    currentWorkspace={rootPath}
                    recentWorkspaces={recentWorkspaces}
                    onSelect={onWorkspaceSwitch || (() => {})}
                    onBrowse={onBrowseWorkspace || (() => {})}
                />
                <button
                    className={`file-explorer-action ${viewMode === 'bookmarks' ? 'active' : ''}`}
                    onClick={() => onViewModeChange(viewMode === 'files' ? 'bookmarks' : 'files')}
                    title={viewMode === 'files' ? 'Show Bookmarks' : 'Show Files'}
                >
                    <Bookmark size={18} />
                </button>
                {onOpenSettings && (
                    <button
                        className="file-explorer-action"
                        onClick={onOpenSettings}
                        title="Settings (Ctrl+,)"
                    >
                        <Settings size={18} />
                    </button>
                )}
            </div>
            <div className="file-explorer-header-bottom">
                {viewMode === 'files' ? (
                    <>
                        <button
                            className="file-explorer-action"
                            onClick={onCreateFile}
                            title="New File"
                        >
                            <Plus size={18} />
                        </button>
                        <button
                            className="file-explorer-action"
                            onClick={onCreateDirectory}
                            title="New Folder"
                        >
                            <FolderPlus size={18} />
                        </button>
                        <button
                            className={`file-explorer-action ${sortOrder !== 'a-z' ? 'active' : ''}`}
                            onClick={onToggleSortMenu}
                            title="Sort Options"
                        >
                            {sortOrder === 'a-z' ? (
                                <ArrowDownAZ size={18} />
                            ) : (
                                <ArrowUpAZ size={18} />
                            )}
                        </button>
                        {sortMenuOpen && (
                            <div className="file-explorer-sort-menu">
                                <div
                                    className="file-explorer-sort-item"
                                    onClick={() => onSortChange('a-z')}
                                >
                                    <span>Name (A to Z)</span>
                                    {sortOrder === 'a-z' && <Check size={18} />}
                                </div>
                                <div
                                    className="file-explorer-sort-item"
                                    onClick={() => onSortChange('z-a')}
                                >
                                    <span>Name (Z to A)</span>
                                    {sortOrder === 'z-a' && <Check size={18} />}
                                </div>
                            </div>
                        )}
                        <button
                            className="file-explorer-action"
                            onClick={onExpandCollapseAll}
                            title={allDirsExpanded ? 'Collapse All' : 'Expand All'}
                        >
                            {allDirsExpanded ? (
                                <ChevronsUp size={16} />
                            ) : (
                                <ChevronsDown size={16} />
                            )}
                        </button>
                    </>
                ) : (
                    <>
                        <button
                            className="file-explorer-action"
                            onClick={onCreateBookmarkGroup}
                            title="New Bookmark Group"
                        >
                            <FolderPlus size={18} />
                        </button>
                        <button
                            className="file-explorer-action"
                            onClick={onExpandCollapseAllBookmarks}
                            title={allBookmarkGroupsExpanded ? 'Collapse All' : 'Expand All'}
                        >
                            {allBookmarkGroupsExpanded ? (
                                <ChevronsUp size={16} />
                            ) : (
                                <ChevronsDown size={16} />
                            )}
                        </button>
                    </>
                )}
            </div>
        </div>
    );
});

FileExplorerHeader.displayName = 'FileExplorerHeader';
