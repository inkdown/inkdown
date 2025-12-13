// Tab-related types
export interface Tab {
    id: string;
    filePath?: string;
    title: string;
    isPinned: boolean;
    isDirty: boolean;
}

export interface TabContent {
    content: string;
    cursorPosition?: number;
    scrollPosition?: number;
}

export interface TabOptions {
    openInNewTab?: boolean;
    pinned?: boolean;
}

export interface TabState {
    tabs: Tab[];
    activeTabId: string | null;
}
