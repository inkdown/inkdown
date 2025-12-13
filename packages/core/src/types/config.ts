// Type definitions for configuration

export interface RecentWorkspace {
    /** Absolute path to workspace */
    path: string;
    /** Display name (derived from path) */
    name: string;
    /** Timestamp of last access */
    lastOpened: number;
}

export interface AppConfig {
    version: string;
    workspace?: string;
    tabs: TabConfig[];
    theme: string;
    colorScheme: 'light' | 'dark';
    font: FontConfig;
    enabledPlugins: string[];
    /** Expanded directory paths in the file explorer */
    expandedDirs?: string[];
    /** Sidebar width in pixels */
    sidebarWidth?: number;
    /** Whether the sidebar is collapsed */
    sidebarCollapsed?: boolean;
    /** List of recently opened workspaces */
    recentWorkspaces?: RecentWorkspace[];
}

export interface TabConfig {
    id: string;
    filePath: string;
    isPinned: boolean;
}

export interface FontConfig {
    family: string;
    size: number;
}
