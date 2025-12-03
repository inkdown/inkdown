/**
 * BookmarkManager - Manages bookmarks and bookmark groups
 * 
 * Provides API for creating, reading, updating, and deleting bookmarks.
 * Bookmarks are organized into groups and persisted to disk.
 */

import type { App } from '../App';
import type { Bookmark, BookmarkGroup, BookmarksConfig } from '../types/bookmarks';
import { Events } from '../Events';

/**
 * Default bookmarks configuration
 */
const DEFAULT_BOOKMARKS_CONFIG: BookmarksConfig = {
    groups: [],
};

/**
 * Manages bookmarks and bookmark groups
 */
export class BookmarkManager extends Events {
    private config: BookmarksConfig = DEFAULT_BOOKMARKS_CONFIG;
    private configLoaded = false;

    constructor(private app: App) {
        super();
    }

    /**
     * Initialize and load bookmarks from config
     */
    async initialize(): Promise<void> {
        await this.loadConfig();
    }

    /**
     * Load bookmarks configuration from disk
     */
    async loadConfig(): Promise<BookmarksConfig> {
        if (this.configLoaded) {
            return this.config;
        }

        try {
            // Use ConfigManager's loadConfig which already implements cache-first strategy
            const config = await this.app.configManager.loadConfig<BookmarksConfig>('bookmarks');
            if (config) {
                this.config = { ...DEFAULT_BOOKMARKS_CONFIG, ...config };
            }
            this.configLoaded = true;
            this.trigger('bookmarks-reloaded');
        } catch (error) {
            console.error('Failed to load bookmarks config:', error);
        }

        return this.config;
    }

    /**
     * Save bookmarks configuration to disk
     */
    private async saveConfig(): Promise<void> {
        try {
            await this.app.configManager.saveConfig('bookmarks', this.config);
        } catch (error) {
            console.error('Failed to save bookmarks config:', error);
            throw error;
        }
    }

    /**
     * Get all bookmark groups
     */
    getGroups(): BookmarkGroup[] {
        return [...this.config.groups];
    }

    /**
     * Get a specific group by ID
     */
    getGroup(groupId: string): BookmarkGroup | undefined {
        return this.config.groups.find((g) => g.id === groupId);
    }

    /**
     * Get group names (for autocomplete/suggestions)
     */
    getGroupNames(): string[] {
        return this.config.groups.map((g) => g.name);
    }

    /**
     * Create a new bookmark group
     */
    async createGroup(name: string, description?: string, color?: string): Promise<BookmarkGroup> {
        // Check if group with same name already exists
        if (this.config.groups.some((g) => g.name === name)) {
            throw new Error(`Group with name "${name}" already exists`);
        }

        const now = Date.now();
        const group: BookmarkGroup = {
            id: `group-${now}-${Math.random().toString(36).substr(2, 9)}`,
            name,
            description,
            color,
            bookmarks: [],
            createdAt: now,
            updatedAt: now,
        };

        this.config.groups.push(group);
        await this.saveConfig();
        this.trigger('group-created', { group });

        return group;
    }

    /**
     * Delete a bookmark group
     */
    async deleteGroup(groupId: string): Promise<void> {
        const index = this.config.groups.findIndex((g) => g.id === groupId);
        if (index === -1) {
            throw new Error(`Group with ID "${groupId}" not found`);
        }

        this.config.groups.splice(index, 1);
        
        // Clear last selected if it was this group
        if (this.config.lastSelectedGroupId === groupId) {
            this.config.lastSelectedGroupId = undefined;
        }

        await this.saveConfig();
        this.trigger('group-deleted', { groupId });
    }

    /**
     * Rename a bookmark group
     */
    async renameGroup(groupId: string, newName: string): Promise<void> {
        const group = this.config.groups.find((g) => g.id === groupId);
        if (!group) {
            throw new Error(`Group with ID "${groupId}" not found`);
        }

        // Check if new name conflicts with another group
        if (this.config.groups.some((g) => g.id !== groupId && g.name === newName)) {
            throw new Error(`Group with name "${newName}" already exists`);
        }

        group.name = newName;
        group.updatedAt = Date.now();
        await this.saveConfig();
        this.trigger('group-renamed', { groupId, newName });
    }

    /**
     * Add a bookmark to a group
     */
    async addBookmark(
        groupId: string,
        filePath: string,
        title?: string,
        note?: string
    ): Promise<Bookmark> {
        const group = this.config.groups.find((g) => g.id === groupId);
        if (!group) {
            throw new Error(`Group with ID "${groupId}" not found`);
        }

        // Check if bookmark already exists in this group
        if (group.bookmarks.some((b) => b.filePath === filePath)) {
            throw new Error('This file is already bookmarked in this group');
        }

        // Extract title from file path if not provided
        const fileName = filePath.split('/').pop() || filePath;
        const defaultTitle = fileName.endsWith('.md') ? fileName.slice(0, -3) : fileName;

        const bookmark: Bookmark = {
            id: `bookmark-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            filePath,
            title: title || defaultTitle,
            note,
            createdAt: Date.now(),
        };

        group.bookmarks.push(bookmark);
        group.updatedAt = Date.now();
        
        // Remember last selected group
        this.config.lastSelectedGroupId = groupId;

        await this.saveConfig();
        this.trigger('bookmark-added', { groupId, bookmark });

        return bookmark;
    }

    /**
     * Remove a bookmark from a group
     */
    async removeBookmark(groupId: string, bookmarkId: string): Promise<void> {
        const group = this.config.groups.find((g) => g.id === groupId);
        if (!group) {
            throw new Error(`Group with ID "${groupId}" not found`);
        }

        const index = group.bookmarks.findIndex((b) => b.id === bookmarkId);
        if (index === -1) {
            throw new Error(`Bookmark with ID "${bookmarkId}" not found`);
        }

        group.bookmarks.splice(index, 1);
        group.updatedAt = Date.now();
        await this.saveConfig();
        this.trigger('bookmark-removed', { groupId, bookmarkId });
    }

    /**
     * Remove bookmark by file path (useful when file is deleted)
     */
    async removeBookmarkByPath(filePath: string): Promise<void> {
        let removed = false;
        
        for (const group of this.config.groups) {
            const index = group.bookmarks.findIndex((b) => b.filePath === filePath);
            if (index !== -1) {
                const bookmarkId = group.bookmarks[index].id;
                group.bookmarks.splice(index, 1);
                group.updatedAt = Date.now();
                this.trigger('bookmark-removed', { groupId: group.id, bookmarkId });
                removed = true;
            }
        }

        if (removed) {
            await this.saveConfig();
        }
    }

    /**
     * Update a bookmark
     */
    async updateBookmark(
        groupId: string,
        bookmarkId: string,
        updates: Partial<Pick<Bookmark, 'title' | 'note'>>
    ): Promise<void> {
        const group = this.config.groups.find((g) => g.id === groupId);
        if (!group) {
            throw new Error(`Group with ID "${groupId}" not found`);
        }

        const bookmark = group.bookmarks.find((b) => b.id === bookmarkId);
        if (!bookmark) {
            throw new Error(`Bookmark with ID "${bookmarkId}" not found`);
        }

        Object.assign(bookmark, updates);
        group.updatedAt = Date.now();
        await this.saveConfig();
        this.trigger('bookmark-updated', { groupId, bookmark });
    }

    /**
     * Check if a file is bookmarked
     */
    isBookmarked(filePath: string): boolean {
        return this.config.groups.some((group) =>
            group.bookmarks.some((bookmark) => bookmark.filePath === filePath)
        );
    }

    /**
     * Get all groups that contain a specific file
     */
    getGroupsForFile(filePath: string): BookmarkGroup[] {
        return this.config.groups.filter((group) =>
            group.bookmarks.some((bookmark) => bookmark.filePath === filePath)
        );
    }

    /**
     * Get bookmark for a file in a specific group
     */
    getBookmark(groupId: string, filePath: string): Bookmark | undefined {
        const group = this.config.groups.find((g) => g.id === groupId);
        if (!group) return undefined;

        return group.bookmarks.find((b) => b.filePath === filePath);
    }

    /**
     * Move bookmark to another group
     */
    async moveBookmark(
        sourceGroupId: string,
        bookmarkId: string,
        targetGroupId: string
    ): Promise<void> {
        const sourceGroup = this.config.groups.find((g) => g.id === sourceGroupId);
        const targetGroup = this.config.groups.find((g) => g.id === targetGroupId);

        if (!sourceGroup) {
            throw new Error(`Source group with ID "${sourceGroupId}" not found`);
        }
        if (!targetGroup) {
            throw new Error(`Target group with ID "${targetGroupId}" not found`);
        }

        const bookmarkIndex = sourceGroup.bookmarks.findIndex((b) => b.id === bookmarkId);
        if (bookmarkIndex === -1) {
            throw new Error(`Bookmark with ID "${bookmarkId}" not found`);
        }

        const bookmark = sourceGroup.bookmarks[bookmarkIndex];

        // Check if already exists in target group
        if (targetGroup.bookmarks.some((b) => b.filePath === bookmark.filePath)) {
            throw new Error('This file is already bookmarked in the target group');
        }

        // Move bookmark
        sourceGroup.bookmarks.splice(bookmarkIndex, 1);
        targetGroup.bookmarks.push(bookmark);

        sourceGroup.updatedAt = Date.now();
        targetGroup.updatedAt = Date.now();

        await this.saveConfig();
        this.trigger('bookmark-removed', { groupId: sourceGroupId, bookmarkId });
        this.trigger('bookmark-added', { groupId: targetGroupId, bookmark });
    }

    /**
     * Get the last selected group ID (for quick bookmark)
     */
    getLastSelectedGroupId(): string | undefined {
        return this.config.lastSelectedGroupId;
    }

    /**
     * Get total bookmark count across all groups
     */
    getTotalBookmarkCount(): number {
        return this.config.groups.reduce((sum, group) => sum + group.bookmarks.length, 0);
    }

    /**
     * Search bookmarks by title
     */
    searchBookmarks(query: string): Array<{ group: BookmarkGroup; bookmark: Bookmark }> {
        const results: Array<{ group: BookmarkGroup; bookmark: Bookmark }> = [];
        const lowerQuery = query.toLowerCase();

        for (const group of this.config.groups) {
            for (const bookmark of group.bookmarks) {
                if (
                    bookmark.title.toLowerCase().includes(lowerQuery) ||
                    bookmark.note?.toLowerCase().includes(lowerQuery)
                ) {
                    results.push({ group, bookmark });
                }
            }
        }

        return results;
    }
}
