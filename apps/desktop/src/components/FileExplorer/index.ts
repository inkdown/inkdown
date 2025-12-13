/**
 * FileExplorer - Main component (refactored)
 *
 * This is the refactored version organized into smaller, reusable components
 * for better performance and maintainability.
 */

export { BookmarkList } from './BookmarkList';
// Note: FileExplorer is the legacy file at ../FileExplorer.tsx, not a component in this directory
export { FileExplorerHeader } from './FileExplorerHeader';
export { FileNodeItem } from './FileNodeItem';
export { FileTreeNode } from './FileTreeNode';
export type { ContextMenuState, CreatingItem, SelectedItem, SortOrder } from './types';
