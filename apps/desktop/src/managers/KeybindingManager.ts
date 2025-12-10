
import type { App } from '@inkdown/core';
import type { Command } from '@inkdown/core';
import type { IKeybindingManager, ShortcutConfig, DefaultShortcuts } from '@inkdown/core';

const DEFAULT_SHORTCUTS: DefaultShortcuts = {
    // Tab management
    'tab:close-tab': { keys: ['Mod', 'W'], name: 'Close Tab' },
    'tab:new-tab': { keys: ['Mod', 'T'], name: 'New Tab' },
    'tab:next-tab': { keys: ['Mod', 'Tab'], name: 'Next Tab' },
    'tab:previous-tab': { keys: ['Mod', 'Shift', 'Tab'], name: 'Previous Tab' },
    'tab:save-file': { keys: ['Mod', 'S'], name: 'Save File' },

    // File management
    'file:new-note': { keys: ['Mod', 'N'], name: 'New Note' },

    // Editor formatting
    'editor:toggle-bold': { keys: ['Mod', 'B'], name: 'Toggle Bold' },
    'editor:toggle-italic': { keys: ['Mod', 'I'], name: 'Toggle Italic' },
    'editor:toggle-strikethrough': { keys: ['Mod', 'Shift', 'S'], name: 'Toggle Strikethrough' },
    'editor:toggle-inline-code': { keys: ['Mod', 'Shift', 'E'], name: 'Toggle Inline Code' },
    'editor:insert-link': { keys: ['Mod', 'K'], name: 'Insert Link' },
    'editor:header-1': { keys: ['Mod', 'Shift', '1'], name: 'Insert Header 1' },
    'editor:header-2': { keys: ['Mod', 'Shift', '2'], name: 'Insert Header 2' },
    'editor:header-3': { keys: ['Mod', 'Shift', '3'], name: 'Insert Header 3' },
    'editor:header-4': { keys: ['Mod', 'Shift', '4'], name: 'Insert Header 4' },
    'editor:header-5': { keys: ['Mod', 'Shift', '5'], name: 'Insert Header 5' },
    'editor:header-6': { keys: ['Mod', 'Shift', '6'], name: 'Insert Header 6' },
    'editor:toggle-blockquote': { keys: ['Mod', 'Shift', '.'], name: 'Toggle Blockquote' },
    'editor:toggle-bullet-list': { keys: ['Mod', 'Shift', '8'], name: 'Toggle Bullet List' },
    'editor:toggle-numbered-list': { keys: ['Mod', 'Shift', '7'], name: 'Toggle Numbered List' },
    'editor:insert-code-block': { keys: ['Mod', 'Shift', 'C'], name: 'Insert Code Block' },
    'editor:toggle-highlight': { keys: ['Mod', 'Shift', 'H'], name: 'Toggle Highlight' },
    'editor:toggle-task-list': { keys: ['Mod', 'L'], name: 'Toggle Task list' },
    'editor:insert-image': { keys: ['Mod', 'Shift', 'K'], name: 'Insert Image' },

    // App
    'app:open-settings': { keys: ['Mod', ','], name: 'Open Settings' },
    'app:toggle-sidebar': { keys: ['Mod', '\\'], name: 'Toggle Sidebar' },
    'app:toggle-view-mode': { keys: ['Mod', 'E'], name: 'Toggle View Mode' },
    'app:open-workspace': { keys: ['Mod', 'Shift', 'O'], name: 'Open Workspace' },
};

/**
 * KeybindingManager - Manages keyboard shortcuts (Desktop implementation)
 * Handles registration, conflict detection, and execution via CommandManager
 */
export class KeybindingManager implements IKeybindingManager {
    private app: App;
    private shortcuts: Map<
        string,
        ShortcutConfig & { source: 'core' | 'plugin'; pluginId?: string }
    > = new Map();
    // Cache default keys from registered commands for reset functionality
    private defaultKeysCache: Map<string, string[]> = new Map();
    private userOverrides: Map<string, string[]> = new Map(); // User customized shortcuts
    private changeListeners: Set<(id: string, keys: string[]) => void> = new Set();

    // Bound handler for proper cleanup
    private boundHandleKeyPress: (e: KeyboardEvent) => void;

    constructor(app: App) {
        this.app = app;
        this.boundHandleKeyPress = this.handleKeyPress.bind(this);
    }

    /**
     * Initialize keybinding manager
     * Loads shortcuts from config and sets up event listeners
     */
    async init(): Promise<void> {
        // Load user overrides from config
        await this.loadUserOverrides();

        // Register default shortcuts
        this.registerDefaultShortcuts();

        // Register Alt+1-9 shortcuts for switching tabs
        this.registerTabSwitchShortcuts();

        // Set up global keyboard event listener
        document.addEventListener('keydown', this.boundHandleKeyPress);

        console.log('KeybindingManager initialized with', this.shortcuts.size, 'shortcuts');
    }

    /**
     * Load user customized shortcuts from config
     */
    private async loadUserOverrides(): Promise<void> {
        try {
            const config = await this.app.configManager.loadConfig<{
                shortcuts: Record<string, { keys: string[] }>;
            }>('shortcuts');

            if (config?.shortcuts) {
                for (const [id, shortcut] of Object.entries(config.shortcuts)) {
                    if (shortcut.keys && Array.isArray(shortcut.keys)) {
                        this.userOverrides.set(id, shortcut.keys);
                    }
                }
            }
        } catch (error: any) {
            console.error('Failed to load shortcut overrides:', error);
        }
    }

    /**
     * Get the effective keys for a shortcut (user override or default)
     */
    private getEffectiveKeys(id: string, defaultKeys: string[]): string[] {
        return this.userOverrides.get(id) || defaultKeys;
    }

    /**
     * Register Alt+1-9 shortcuts for switching tabs
     */
    private registerTabSwitchShortcuts(): void {
        for (let i = 1; i <= 9; i++) {
            const id = `switch-tab-${i}`;
            const keys = this.getEffectiveKeys(id, ['Alt', `${i}`]);
            this.shortcuts.set(id, {
                id,
                name: `Switch to Tab ${i}`,
                keys,
                action: id,
                editable: true,
                source: 'core',
            });
            this.defaultKeysCache.set(id, ['Alt', `${i}`]);
        }
    }

    /**
     * Register default shortcuts
     */
    private registerDefaultShortcuts(): void {
        for (const [id, config] of Object.entries(DEFAULT_SHORTCUTS)) {
            const keys = this.getEffectiveKeys(id, config.keys);
            this.shortcuts.set(id, {
                id,
                name: config.name,
                keys,
                action: id,
                editable: true,
                source: 'core',
            });
            this.defaultKeysCache.set(id, config.keys);
        }
    }

    /**
     * Convert Hotkey[] format to string[] format
     * e.g., [{ modifiers: ['Mod', 'Shift'], key: 'p' }] -> ['Mod', 'Shift', 'P']
     */
    private convertHotkeysToKeys(hotkeys: Array<{ modifiers: string[]; key: string }>): string[] {
        if (!hotkeys || hotkeys.length === 0) return [];

        // Use the first hotkey definition
        const hotkey = hotkeys[0];
        if (!hotkey) return [];

        const keys: string[] = [...(hotkey.modifiers || [])];
        if (hotkey.key) {
            // Normalize key to uppercase for consistency
            keys.push(hotkey.key.length === 1 ? hotkey.key.toUpperCase() : hotkey.key);
        }
        return keys;
    }

    /**
     * Register a command's shortcut
     */
    registerCommand(
        command: Command,
        source: 'core' | 'plugin' = 'plugin',
        pluginId?: string,
    ): void {
        console.log('[KeybindingManager] registerCommand called:', command.id);

        // Calculate default keys
        let defaultKeys = command.hotkey || [];

        // Convert hotkeys format if hotkey is empty but hotkeys exists
        if (defaultKeys.length === 0 && command.hotkeys && command.hotkeys.length > 0) {
            defaultKeys = this.convertHotkeysToKeys(command.hotkeys);
        }

        // Cache default keys
        this.defaultKeysCache.set(command.id, defaultKeys);

        if (defaultKeys.length > 0 || this.userOverrides.has(command.id)) {
            // Use user override if available, otherwise default
            const effectiveKeys = this.getEffectiveKeys(command.id, defaultKeys);

            if (effectiveKeys.length > 0) {
                this.registerShortcut(
                    command.id,
                    {
                        id: command.id,
                        name: command.name,
                        keys: effectiveKeys,
                        action: command.id, // The action is the command ID
                        editable: true,
                    },
                    source,
                    pluginId,
                );
            }
        }
    }

    /**
     * Unregister a command
     */
    unregisterCommand(commandId: string): void {
        this.shortcuts.delete(commandId);
        this.defaultKeysCache.delete(commandId);
    }

    /**
     * Register a shortcut
     */
    registerShortcut(
        id: string,
        config: ShortcutConfig,
        source: 'core' | 'plugin' = 'plugin',
        pluginId?: string,
    ): void {
        // Check for conflicts
        const conflict = this.checkConflict(config.keys, id);
        if (conflict) {
            const existingShortcut = this.shortcuts.get(conflict);

            // If existing is core and new is plugin, reject the new one
            if (existingShortcut?.source === 'core' && source === 'plugin') {
                console.warn(
                    `Plugin shortcut ${id} (${config.keys.join('+')}) conflicts with core shortcut ${conflict}. Plugin shortcut will be ignored.`,
                );
                return;
            }

            // If existing is plugin and new is core, override
            if (existingShortcut?.source === 'plugin' && source === 'core') {
                console.warn(
                    `Core shortcut ${id} (${config.keys.join('+')}) overrides plugin shortcut ${conflict}.`,
                );
                this.shortcuts.delete(conflict);
            }
        }

        this.shortcuts.set(id, { ...config, source, pluginId });
    }

    /**
     * Unregister a shortcut
     */
    unregisterShortcut(id: string): void {
        this.shortcuts.delete(id);
    }

    /**
     * Update a shortcut - this is called when user changes a shortcut in settings
     */
    async updateShortcut(id: string, keys: string[]): Promise<void> {
        const shortcut = this.shortcuts.get(id);
        if (!shortcut) {
            // It might be a command that had no shortcut before, but now user is adding one.
            // But we need the command info (name, etc). 
            // In that case, settings UI should have access to default commands list.
            console.error(`Shortcut ${id} not found in active shortcuts`);
            return;
        }

        // Check for conflicts
        const conflict = this.checkConflict(keys, id);
        if (conflict) {
            throw new Error(`Shortcut conflict: ${keys.join('+')} is already used by ${conflict}`);
        }

        shortcut.keys = [...keys];
        this.shortcuts.set(id, { ...shortcut });

        this.userOverrides.set(id, keys);
        await this.saveShortcuts();
        this.notifyChange(id, keys);
    }

    /**
     * Reset a shortcut to its default
     */
    async resetShortcut(id: string): Promise<void> {
        const shortcut = this.shortcuts.get(id);
        if (!shortcut) return;

        // Get default keys from cache
        const defaultKeys = this.defaultKeysCache.get(id);
        if (!defaultKeys) {
            console.warn(`No default found for shortcut ${id}`);
            return;
        }

        const conflict = this.checkConflict(defaultKeys, id);
        if (conflict) {
            throw new Error(
                `Cannot reset: default keys ${defaultKeys.join('+')} conflict with ${conflict}`,
            );
        }

        shortcut.keys = [...defaultKeys];
        this.shortcuts.set(id, { ...shortcut });

        this.userOverrides.delete(id);
        await this.saveShortcuts();
        this.notifyChange(id, defaultKeys);
    }

    /**
     * Subscribe to shortcut changes
     */
    onShortcutChange(listener: (id: string, keys: string[]) => void): () => void {
        this.changeListeners.add(listener);
        return () => {
            this.changeListeners.delete(listener);
        };
    }

    /**
     * Notify all listeners about a shortcut change
     */
    private notifyChange(id: string, keys: string[]): void {
        for (const listener of this.changeListeners) {
            try {
                listener(id, keys);
            } catch (error: any) {
                console.error('Error in shortcut change listener:', error);
            }
        }

        if (typeof window !== 'undefined') {
            window.dispatchEvent(
                new CustomEvent('shortcut-changed', {
                    detail: { id, keys },
                }),
            );
        }
    }

    /**
     * Check if a key combination conflicts with existing shortcuts
     */
    checkConflict(keys: string[], excludeId?: string): string | null {
        const normalizedNew = this.normalizeKeys(keys);

        for (const [id, shortcut] of this.shortcuts.entries()) {
            if (excludeId && id === excludeId) continue;
            if (this.normalizeKeys(shortcut.keys) === normalizedNew) {
                return id;
            }
        }
        return null;
    }

    /**
     * Handle keyboard events
     */
    handleKeyPress(event: KeyboardEvent): void {
        // Ignore if we're in an input element (except for specific shortcuts)
        const target = event.target as HTMLElement;
        const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA';
        const isEditor = target.closest('.cm-editor') !== null;

        const keys: string[] = [];
        if (event.ctrlKey || event.metaKey) keys.push('Mod');
        if (event.altKey) keys.push('Alt');
        if (event.shiftKey) keys.push('Shift');
        const key = event.key;
        if (key && key.length === 1) keys.push(key.toUpperCase());
        else if (key) keys.push(key);

        if (!event.ctrlKey && !event.metaKey && !event.altKey) return;

        const normalizedKeys = this.normalizeKeys(keys);

        for (const [, shortcut] of this.shortcuts.entries()) {
            if (this.normalizeKeys(shortcut.keys) === normalizedKeys) {
                // Editor check
                if (shortcut.action.startsWith('editor:') && !isEditor) continue;
                if (isInput && !isEditor && !this.isGlobalShortcut(shortcut.action)) continue;

                // Execute via CommandManager
                this.app.commandManager.executeCommand(shortcut.action);

                event.preventDefault();
                event.stopPropagation();
                return;
            }
        }
    }

    private isGlobalShortcut(action: string): boolean {
        // Core commands that should work in inputs
        const globalActions = [
            'tab:save-file',
            'tab:close-tab',
            'tab:new-tab',
            'file:new-note',
            'app:open-settings',
            'app:toggle-sidebar',
        ];
        return globalActions.includes(action);
    }

    private normalizeKeys(keys: string[]): string {
        return keys.map((k) => k.toUpperCase()).sort().join('+');
    }

    getAllShortcuts() {
        return Array.from(this.shortcuts.values());
    }

    getKeysForCommand(commandId: string): string[] {
        const shortcut = this.shortcuts.get(commandId);
        return shortcut ? shortcut.keys : [];
    }

    isCustomized(id: string): boolean {
        return this.userOverrides.has(id);
    }

    private async saveShortcuts(): Promise<void> {
        const config: { shortcuts: Record<string, { keys: string[] }> } = { shortcuts: {} };
        for (const [id, keys] of this.userOverrides.entries()) {
            config.shortcuts[id] = { keys };
        }
        await this.app.configManager.saveConfig('shortcuts', config);
    }

    cleanup(): void {
        document.removeEventListener('keydown', this.boundHandleKeyPress);
    }
}
