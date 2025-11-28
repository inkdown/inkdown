// Shortcuts configuration
export interface ShortcutsConfig {
    shortcuts: Record<string, ShortcutConfig>;
}

export interface ShortcutConfig {
    id: string;
    name: string;
    keys: string[];
    action: string;
    editable: boolean;
}

// Default shortcuts definition
export interface DefaultShortcuts {
    [id: string]: {
        keys: string[];
        name: string;
    };
}

// Modifier keys
export type ModifierKey = 'Ctrl' | 'Alt' | 'Shift' | 'Mod' | 'Meta';

// Keyboard event with modifiers
export interface KeyboardShortcut {
    modifiers: ModifierKey[];
    key: string;
}
