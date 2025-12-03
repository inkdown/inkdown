/**
 * Bookmark Types
 * 
 * Defines the structure for bookmarks and bookmark groups
 */

/**
 * Individual bookmark entry
 */
export interface Bookmark {
    /** Unique identifier for the bookmark */
    id: string;
    /** Absolute path to the file */
    filePath: string;
    /** Name/title of the bookmark (can be different from filename) */
    title: string;
    /** Timestamp when bookmark was created */
    createdAt: number;
    /** Optional note/description */
    note?: string;
}

/**
 * Bookmark group/collection
 */
export interface BookmarkGroup {
    /** Unique identifier for the group */
    id: string;
    /** Name of the group */
    name: string;
    /** Optional description */
    description?: string;
    /** Color/icon identifier (for UI customization) */
    color?: string;
    /** Bookmarks in this group */
    bookmarks: Bookmark[];
    /** Timestamp when group was created */
    createdAt: number;
    /** Timestamp when group was last modified */
    updatedAt: number;
}

/**
 * Bookmarks configuration stored in config
 */
export interface BookmarksConfig {
    /** All bookmark groups */
    groups: BookmarkGroup[];
    /** Last selected group ID (for quick add) */
    lastSelectedGroupId?: string;
}

/**
 * Events emitted by BookmarkManager
 */
export interface BookmarkEvents {
    /** Fired when a bookmark is added */
    'bookmark-added': { groupId: string; bookmark: Bookmark };
    /** Fired when a bookmark is removed */
    'bookmark-removed': { groupId: string; bookmarkId: string };
    /** Fired when a bookmark is updated */
    'bookmark-updated': { groupId: string; bookmark: Bookmark };
    /** Fired when a group is created */
    'group-created': { group: BookmarkGroup };
    /** Fired when a group is deleted */
    'group-deleted': { groupId: string };
    /** Fired when a group is renamed */
    'group-renamed': { groupId: string; newName: string };
    /** Fired when bookmarks are reloaded */
    'bookmarks-reloaded': void;
}
