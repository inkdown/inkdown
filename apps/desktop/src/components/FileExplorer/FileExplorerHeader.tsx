import type { RecentWorkspace } from '@inkdown/core';
import { WorkspaceSwitcher } from '@inkdown/ui';
import {
    ArrowDownAZ,
    ArrowUpAZ,
    Bookmark,
    Check,
    ChevronsDown,
    ChevronsUp,
    FilePlus,
    FolderPlus,
    Settings,
} from 'lucide-react';
import { memo } from 'react';
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
    /** Whether to show macOS traffic lights */
    useCustomTitleBar?: boolean;

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

export const FileExplorerHeader = memo<FileExplorerHeaderProps>(
    ({
        rootPath,
        recentWorkspaces,
        viewMode,
        onViewModeChange,
        onOpenSettings,
        onWorkspaceSwitch,
        onBrowseWorkspace,
        useCustomTitleBar,
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
        const isMacOS = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
        const hasMacTitleBar = useCustomTitleBar && isMacOS;

        return (
            <div className={`file-explorer-header ${hasMacTitleBar ? 'with-traffic-lights' : ''}`}>
                {/* Main header row - workspace + settings */}
                <div className="file-explorer-header-main" data-tauri-drag-region>
                    <div className="file-explorer-header-workspace">
                        <WorkspaceSwitcher
                            currentWorkspace={rootPath}
                            recentWorkspaces={recentWorkspaces}
                            onSelect={onWorkspaceSwitch || (() => {})}
                            onBrowse={onBrowseWorkspace || (() => {})}
                        />
                    </div>
                    <div className="file-explorer-header-actions">
                        <button
                            type="button"
                            className={`file-explorer-action ${viewMode === 'bookmarks' ? 'active' : ''}`}
                            onClick={() =>
                                onViewModeChange(viewMode === 'files' ? 'bookmarks' : 'files')
                            }
                            title={viewMode === 'files' ? 'Show Bookmarks' : 'Show Files'}
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

                {/* Toolbar row - contextual actions */}
                <div className="file-explorer-toolbar">
                    {viewMode === 'files' ? (
                        <>
                            <div className="file-explorer-toolbar-group">
                                <button
                                    type="button"
                                    className="file-explorer-action"
                                    onClick={onCreateFile}
                                    title="New File"
                                >
                                    <FilePlus size={16} />
                                </button>
                                <button
                                    type="button"
                                    className="file-explorer-action"
                                    onClick={onCreateDirectory}
                                    title="New Folder"
                                >
                                    <FolderPlus size={16} />
                                </button>
                            </div>
                            <div className="file-explorer-toolbar-separator" />
                            <div className="file-explorer-toolbar-group">
                                <button
                                    type="button"
                                    className={`file-explorer-action ${sortOrder !== 'a-z' ? 'active' : ''}`}
                                    onClick={onToggleSortMenu}
                                    title="Sort Options"
                                >
                                    {sortOrder === 'a-z' ? (
                                        <ArrowDownAZ size={16} />
                                    ) : (
                                        <ArrowUpAZ size={16} />
                                    )}
                                </button>
                                {sortMenuOpen && (
                                    <div className="file-explorer-sort-menu">
                                        <div
                                            className="file-explorer-sort-item"
                                            onClick={() => onSortChange('a-z')}
                                        >
                                            <span>Name (A to Z)</span>
                                            {sortOrder === 'a-z' && <Check size={16} />}
                                        </div>
                                        <div
                                            className="file-explorer-sort-item"
                                            onClick={() => onSortChange('z-a')}
                                        >
                                            <span>Name (Z to A)</span>
                                            {sortOrder === 'z-a' && <Check size={16} />}
                                        </div>
                                    </div>
                                )}
                                <button
                                    type="button"
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
                            </div>
                        </>
                    ) : (
                        <div className="file-explorer-toolbar-group">
                            <button
                                type="button"
                                className="file-explorer-action"
                                onClick={onCreateBookmarkGroup}
                                title="New Bookmark Group"
                            >
                                <FolderPlus size={16} />
                            </button>
                            <button
                                type="button"
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
                        </div>
                    )}
                </div>
            </div>
        );
    },
);

FileExplorerHeader.displayName = 'FileExplorerHeader';
