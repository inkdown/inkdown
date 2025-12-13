/**
 * @inkdown/editor - Keymaps Module
 *
 * Provides CodeMirror keymaps for markdown editing.
 * These keymaps integrate with the ShortcutManager from @inkdown/core
 * to respect user-customized shortcuts.
 */

import type { Extension } from '@codemirror/state';
import { keymap } from '@codemirror/view';
import type { CommandManager } from '../../managers/CommandManager';
import type { IKeybindingManager } from '../../types/shortcuts';
import {
    insertCodeBlock,
    insertHeader1,
    insertHeader2,
    insertHeader3,
    insertHeader4,
    insertHeader5,
    insertHeader6,
    insertHorizontalRule,
    insertImage,
    insertTable,
    toggleBlockquote,
} from '../commands/blocks';
import {
    insertLink,
    toggleBold,
    toggleHighlight,
    toggleInlineCode,
    toggleItalic,
    toggleStrikethrough,
} from '../commands/formatting';
import { toggleBulletList, toggleNumberedList, toggleTaskList } from '../commands/lists';

/**
 * Command definition with id, name, and handler
 */
interface EditorCommand {
    id: string;
    name: string;
    defaultKeys: string[];
    run: (view: any) => boolean;
}

/**
 * All available editor commands
 * This serves as the source of truth for editor shortcuts
 */
export const EDITOR_COMMANDS: EditorCommand[] = [
    // Formatting
    { id: 'editor:toggle-bold', name: 'Toggle Bold', defaultKeys: ['Mod', 'B'], run: toggleBold },
    {
        id: 'editor:toggle-italic',
        name: 'Toggle Italic',
        defaultKeys: ['Mod', 'I'],
        run: toggleItalic,
    },
    {
        id: 'editor:toggle-strikethrough',
        name: 'Toggle Strikethrough',
        defaultKeys: ['Mod', 'Shift', 'S'],
        run: toggleStrikethrough,
    },
    {
        id: 'editor:toggle-inline-code',
        name: 'Toggle Inline Code',
        defaultKeys: ['Mod', 'Shift', 'E'],
        run: toggleInlineCode,
    },
    {
        id: 'editor:toggle-highlight',
        name: 'Toggle Highlight',
        defaultKeys: ['Mod', 'Shift', 'H'],
        run: toggleHighlight,
    },
    { id: 'editor:insert-link', name: 'Insert Link', defaultKeys: ['Mod', 'K'], run: insertLink },
    {
        id: 'editor:insert-image',
        name: 'Insert Image',
        defaultKeys: ['Mod', 'Shift', 'K'],
        run: insertImage,
    },

    // Headers
    {
        id: 'editor:header-1',
        name: 'Insert Header 1',
        defaultKeys: ['Mod', 'Shift', '1'],
        run: insertHeader1,
    },
    {
        id: 'editor:header-2',
        name: 'Insert Header 2',
        defaultKeys: ['Mod', 'Shift', '2'],
        run: insertHeader2,
    },
    {
        id: 'editor:header-3',
        name: 'Insert Header 3',
        defaultKeys: ['Mod', 'Shift', '3'],
        run: insertHeader3,
    },
    {
        id: 'editor:header-4',
        name: 'Insert Header 4',
        defaultKeys: ['Mod', 'Shift', '4'],
        run: insertHeader4,
    },
    {
        id: 'editor:header-5',
        name: 'Insert Header 5',
        defaultKeys: ['Mod', 'Shift', '5'],
        run: insertHeader5,
    },
    {
        id: 'editor:header-6',
        name: 'Insert Header 6',
        defaultKeys: ['Mod', 'Shift', '6'],
        run: insertHeader6,
    },

    // Lists
    {
        id: 'editor:toggle-bullet-list',
        name: 'Toggle Bullet List',
        defaultKeys: ['Mod', 'Shift', '8'],
        run: toggleBulletList,
    },
    {
        id: 'editor:toggle-numbered-list',
        name: 'Toggle Numbered List',
        defaultKeys: ['Mod', 'Shift', '7'],
        run: toggleNumberedList,
    },
    {
        id: 'editor:toggle-task-list',
        name: 'Toggle Task List',
        defaultKeys: ['Mod', 'L'],
        run: toggleTaskList,
    },

    // Blocks
    {
        id: 'editor:toggle-blockquote',
        name: 'Toggle Blockquote',
        defaultKeys: ['Mod', 'Shift', '.'],
        run: toggleBlockquote,
    },
    {
        id: 'editor:insert-code-block',
        name: 'Insert Code Block',
        defaultKeys: ['Mod', 'Shift', 'C'],
        run: insertCodeBlock,
    },
    {
        id: 'editor:insert-horizontal-rule',
        name: 'Insert Horizontal Rule',
        defaultKeys: ['Mod', 'Shift', '-'],
        run: insertHorizontalRule,
    },
    {
        id: 'editor:insert-table',
        name: 'Insert Table',
        defaultKeys: ['Mod', 'Shift', 'T'],
        run: insertTable,
    },
];

/**
 * Convert our key format to CodeMirror key format
 * Mod -> Ctrl on Linux/Windows, Cmd on Mac
 */
function keysToCodeMirrorKey(keys: string[]): string {
    return keys
        .map((k) => {
            if (k === 'Mod') return 'Mod';
            if (k === 'Shift') return 'Shift';
            if (k === 'Alt') return 'Alt';
            if (k === 'Ctrl') return 'Ctrl';
            // Single character keys should be lowercase for CodeMirror
            if (k.length === 1) return k.toLowerCase();
            return k;
        })
        .join('-');
}

/**
 * Create the default markdown keymap extension
 * Uses default key bindings
 */
export function createMarkdownKeymap(): Extension {
    const bindings = EDITOR_COMMANDS.map((cmd) => ({
        key: keysToCodeMirrorKey(cmd.defaultKeys),
        run: cmd.run,
        preventDefault: true,
    }));

    return keymap.of(bindings);
}

/**
 * Create a markdown keymap that respects user customizations
 * Reads current shortcuts from ShortcutManager
 */
export function createCustomizableKeymap(keybindingManager: IKeybindingManager): Extension {
    const bindings = EDITOR_COMMANDS.map((cmd) => {
        // Get user-customized keys or fall back to defaults
        const keys = keybindingManager.getKeysForCommand(cmd.id);
        const effectiveKeys = (keys && keys.length > 0) ? keys : cmd.defaultKeys;

        return {
            key: keysToCodeMirrorKey(effectiveKeys),
            run: cmd.run,
            preventDefault: true,
        };
    });

    return keymap.of(bindings);
}

/**
 * Create a keymap for handling suggestion navigation
 * Routes ArrowUp, ArrowDown, Enter, Escape to active EditorSuggest instances
 * Returns true to intercept the event, false to allow default behavior
 */
export function createSuggestionKeymap(app: any): Extension {
    return keymap.of([
        {
            key: 'ArrowUp',
            run: () => {
                // Check if any suggest is open
                for (const suggest of app.editorSuggests) {
                    if (suggest.isOpen) {
                        suggest.selectPrevious();
                        return true; // Intercept event
                    }
                }
                return false; // Allow default editor behavior
            },
        },
        {
            key: 'ArrowDown',
            run: () => {
                // Check if any suggest is open
                for (const suggest of app.editorSuggests) {
                    if (suggest.isOpen) {
                        suggest.selectNext();
                        return true; // Intercept event
                    }
                }
                return false; // Allow default editor behavior
            },
        },
        {
            key: 'Enter',
            run: () => {
                // Check if any suggest is open
                for (const suggest of app.editorSuggests) {
                    if (suggest.isOpen) {
                        const current = suggest.suggestions[suggest.selectedItem];
                        if (current) {
                            // Create a synthetic keyboard event for selectSuggestion
                            const syntheticEvent = new KeyboardEvent('keydown', {
                                key: 'Enter',
                                bubbles: false,
                                cancelable: true,
                            });
                            suggest.selectSuggestion(current, syntheticEvent);
                            suggest.close();
                        }
                        return true; // Intercept event
                    }
                }
                return false; // Allow default editor behavior
            },
        },
        {
            key: 'Escape',
            run: () => {
                // Check if any suggest is open
                for (const suggest of app.editorSuggests) {
                    if (suggest.isOpen) {
                        suggest.close();
                        return true; // Intercept event
                    }
                }
                return false; // Allow default editor behavior
            },
        },
    ]);
}

/**
 * Register all editor commands with the ShortcutManager
 * This makes them appear in the shortcuts settings UI
 */
export function registerEditorCommands(commandManager: CommandManager): void {
    for (const cmd of EDITOR_COMMANDS) {
        commandManager.registerCommand(
            {
                id: cmd.id,
                name: cmd.name,
                hotkey: cmd.defaultKeys,
                callback: () => {
                    // Commands are executed via CodeMirror keymaps
                    // This registration is for the settings UI and global command palette
                },
            },
            'core',
        );
    }
}

/**
 * Get command by ID
 */
export function getEditorCommand(id: string): EditorCommand | undefined {
    return EDITOR_COMMANDS.find((cmd) => cmd.id === id);
}

/**
 * Execute a command by ID on a given EditorView
 */
export function executeEditorCommand(id: string, view: any): boolean {
    const cmd = getEditorCommand(id);
    if (cmd && view) {
        return cmd.run(view);
    }
    return false;
}
