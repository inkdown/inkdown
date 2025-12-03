export type SelectedItem = {
    path: string;
    isDirectory: boolean;
    name: string;
};

export type SortOrder = 'a-z' | 'z-a';

export type CreatingItem = {
    parentPath: string;
    type: 'file' | 'directory';
    tempId: string;
};

export type ContextMenuState = {
    x: number;
    y: number;
    path: string | null;
    isDirectory: boolean;
    isRoot?: boolean;
} | null;
