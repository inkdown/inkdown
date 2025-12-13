import type { App } from '../App';
import type { Command } from '../types/plugin';

/**
 * CommandManager - Manages application commands
 * Handles registration and execution of commands (actions)
 */
export class CommandManager {
    private app: App;
    private commands: Map<string, Command> = new Map();

    constructor(app: App) {
        this.app = app;
    }

    /**
     * Register a command
     */
    registerCommand(
        command: Command,
        _source: 'core' | 'plugin' = 'plugin',
        _pluginId?: string,
    ): void {
        console.log('[CommandManager] Registering command:', command.id);
        this.commands.set(command.id, { ...command }); // We might want to store source metadata too if needed
        // For now, Command type doesn't support source directly in strict sense unless we extend it or just rely on the map value
    }

    /**
     * Unregister a command
     */
    unregisterCommand(commandId: string): void {
        this.commands.delete(commandId);
    }

    /**
     * Execute a command by action name
     * @returns true if handled
     */
    executeCommand(action: string): boolean {
        // Handle built-in actions that might be legacy
        if (action.startsWith('switch-tab-')) {
            const tabIndex = Number.parseInt(action.split('-')[2], 10) - 1;
            this.app.tabManager.switchToTabByIndex(tabIndex);
            return true;
        }

        // Execute registered command
        const command = this.commands.get(action);
        if (command) {
            if (command.checkCallback) {
                const canRun = command.checkCallback(true);
                if (canRun) {
                    command.checkCallback(false);
                    return true;
                }
            } else if (command.callback) {
                const result = command.callback();
                if (result instanceof Promise) {
                    // We can't wait for promise here if we want synchronous return,
                    // but we assume if callback fired, it's handled.
                }
                return true;
            }
        } else {
            console.warn(`Command ${action} not found`);
        }
        return false;
    }

    /**
     * Get all registered commands
     */
    getCommands(): Command[] {
        return Array.from(this.commands.values());
    }

    /**
     * Get command by ID
     */
    getCommand(id: string): Command | undefined {
        return this.commands.get(id);
    }

    /**
     * Register all core commands
     */
    registerCoreCommands(): void {
        // Tab management commands
        this.registerCommand(
            {
                id: 'tab:new-tab',
                name: 'New Tab',
                hotkey: ['Mod', 'T'],
                callback: () => {
                    this.app.tabManager.createEmptyTab();
                },
            },
            'core',
        );

        this.registerCommand(
            {
                id: 'tab:close-tab',
                name: 'Close Tab',
                hotkey: ['Mod', 'W'],
                callback: () => {
                    const activeTab = this.app.tabManager.getActiveTab();
                    if (activeTab) {
                        this.app.tabManager.closeTab(activeTab.id);
                    }
                },
            },
            'core',
        );

        this.registerCommand(
            {
                id: 'tab:save-file',
                name: 'Save File',
                hotkey: ['Mod', 'S'],
                callback: async () => {
                    const activeTab = this.app.tabManager.getActiveTab();
                    if (activeTab?.filePath) {
                        await this.app.editorStateManager.saveFile(activeTab.filePath);
                    }
                },
            },
            'core',
        );

        this.registerCommand(
            {
                id: 'tab:next-tab',
                name: 'Next Tab',
                hotkey: ['Mod', 'Tab'],
                callback: () => {
                    this.app.tabManager.switchToNextTab();
                },
            },
            'core',
        );

        this.registerCommand(
            {
                id: 'tab:previous-tab',
                name: 'Previous Tab',
                hotkey: ['Mod', 'Shift', 'Tab'],
                callback: () => {
                    this.app.tabManager.switchToPreviousTab();
                },
            },
            'core',
        );

        // File management commands
        this.registerCommand(
            {
                id: 'file:new-note',
                name: 'New Note',
                hotkey: ['Mod', 'N'],
                callback: async () => {
                    try {
                        // Create a new note using FilesConfigManager
                        const newNotePath = await this.app.filesConfigManager.createNewNote();

                        // Open the new note in a tab
                        await this.app.tabManager.openTab(newNotePath);

                        // Trigger file-create event to refresh file tree
                        const filename = newNotePath.split('/').pop() || 'Untitled.md';
                        this.app.workspace._onFileCreate({
                            path: newNotePath,
                            name: filename,
                            basename: filename.replace(/\.md$/, ''),
                            extension: 'md',
                            stat: {
                                size: 0,
                                mtime: Date.now(),
                                ctime: Date.now(),
                            },
                        });
                    } catch (error: any) {
                        console.error('Failed to create new note:', error);
                    }
                },
            },
            'core',
        );

        // App-level commands (placeholders)
        this.registerCommand(
            {
                id: 'app:toggle-sidebar',
                name: 'Toggle Sidebar',
                hotkey: ['Mod', '\\'],
                callback: () => {
                    console.log('Toggle sidebar command executed (handler should be overridden by UI)');
                },
            },
            'core',
        );
    }
}
