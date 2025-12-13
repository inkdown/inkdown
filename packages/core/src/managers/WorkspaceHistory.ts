import type { RecentWorkspace } from '../types/config';

/**
 * WorkspaceHistory - Utility for managing workspace history
 * Handles adding, removing, and retrieving recent workspaces
 */
export class WorkspaceHistory {
    /** Maximum number of recent workspaces to keep */
    private static readonly MAX_RECENT = 10;

    /**
     * Add a workspace to the history
     * If workspace already exists, moves it to the top
     * Limits history to MAX_RECENT items
     */
    static addWorkspace(workspaces: RecentWorkspace[], path: string): RecentWorkspace[] {
        const name = WorkspaceHistory.getWorkspaceName(path);
        const now = Date.now();

        // Remove existing entry if present
        const filtered = workspaces.filter((ws) => ws.path !== path);

        // Add to front
        const updated: RecentWorkspace[] = [{ path, name, lastOpened: now }, ...filtered];

        // Limit to MAX_RECENT
        return updated.slice(0, WorkspaceHistory.MAX_RECENT);
    }

    /**
     * Get recent workspaces sorted by last opened (newest first)
     */
    static getRecent(workspaces: RecentWorkspace[]): RecentWorkspace[] {
        return [...workspaces].sort((a, b) => b.lastOpened - a.lastOpened);
    }

    /**
     * Remove a workspace from history
     */
    static removeWorkspace(workspaces: RecentWorkspace[], path: string): RecentWorkspace[] {
        return workspaces.filter((ws) => ws.path !== path);
    }

    /**
     * Extract a display name from workspace path
     * Returns the last component of the path
     */
    static getWorkspaceName(path: string): string {
        const parts = path.split(/[/\\]/);
        return parts[parts.length - 1] || 'Workspace';
    }
}
