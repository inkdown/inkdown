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

export interface IKeybindingManager {
    /**
     * Register keys for a command
     */
    registerCommand(command: any, source?: string, pluginId?: string): void;

    /**
     * Unregister keys for a command
     */
    unregisterCommand(commandId: string): void;

    /**
     * Get keys for a command
     */
    getKeysForCommand(commandId: string): string[];
}
