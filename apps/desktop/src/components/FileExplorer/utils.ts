import type { FileNode } from '@inkdown/core';
import { useCallback, useMemo } from 'react';
import type { SortOrder } from './types';

// Helper to get file/directory info from path
export const getItemInfo = (path: string, files: FileNode[]) => {
    const findInTree = (nodes: FileNode[]): any => {
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
export const sortFileTree = (nodes: FileNode[], order: SortOrder): FileNode[] => {
    // Optimization: Backend already sorts A-Z (directories first)
    if (order === 'a-z') {
        return nodes;
    }

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
export const getAllDirectoryPaths = (nodes: FileNode[]): string[] => {
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

// Hook for expanded directories management
export const useExpandedDirs = (
    files: FileNode[],
    expandedDirs: Set<string>,
    onExpandedDirsChange?: (expandedDirs: string[]) => void,
) => {
    const allDirsExpanded = useMemo(() => {
        const allPaths = getAllDirectoryPaths(files);
        if (allPaths.length === 0) return true;
        return allPaths.every((path) => expandedDirs.has(path));
    }, [files, expandedDirs]);

    const handleExpandCollapseAll = useCallback(() => {
        if (allDirsExpanded) {
            onExpandedDirsChange?.([]);
        } else {
            const allPaths = getAllDirectoryPaths(files);
            onExpandedDirsChange?.(allPaths);
        }
    }, [files, allDirsExpanded, onExpandedDirsChange]);

    return { allDirsExpanded, handleExpandCollapseAll };
};

// Hook for bookmark groups management
export const useBookmarkGroups = (bookmarkGroups: any[], expandedBookmarkGroups: Set<string>) => {
    const allBookmarkGroupsExpanded = useMemo(() => {
        if (bookmarkGroups.length === 0) return true;
        return bookmarkGroups.every((group) => expandedBookmarkGroups.has(group.id));
    }, [bookmarkGroups, expandedBookmarkGroups]);

    const handleExpandCollapseAllBookmarks = useCallback(
        (setExpandedBookmarkGroups: React.Dispatch<React.SetStateAction<Set<string>>>) => {
            if (allBookmarkGroupsExpanded) {
                setExpandedBookmarkGroups(new Set());
            } else {
                const allGroupIds = bookmarkGroups.map((g) => g.id);
                setExpandedBookmarkGroups(new Set(allGroupIds));
            }
        },
        [bookmarkGroups, allBookmarkGroupsExpanded],
    );

    return { allBookmarkGroupsExpanded, handleExpandCollapseAllBookmarks };
};
