import type { App } from './App';
import type { Command } from './types/plugin';
import type { DefaultShortcuts, ShortcutConfig } from './types/shortcuts';

/**
 * Default shortcuts configuration
 * These are the factory defaults that can be reset to
 */
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
    'app:toggle-sidebar': { keys: ['Mod', '\\\\'], name: 'Toggle Sidebar' },
    'app:toggle-view-mode': { keys: ['Mod', 'E'], name: 'Toggle View Mode' },
};

/**
 * ShortcutManager - Manages keyboard shortcuts
 * Handles registration, conflict detection, and execution
 */
export class ShortcutManager {
    private app: App;
    private shortcuts: Map<
        string,
        ShortcutConfig & { source: 'core' | 'plugin'; pluginId?: string }
    > = new Map();
    private commands: Map<string, Command> = new Map();
    private defaultShortcuts: DefaultShortcuts = DEFAULT_SHORTCUTS;
    private userOverrides: Map<string, string[]> = new Map(); // User customized shortcuts
    private changeListeners: Set<(id: string, keys: string[]) => void> = new Set();

    constructor(app: App) {
        this.app = app;
        this.boundHandleKeyPress = this.handleKeyPress.bind(this);
    }

    // Bound handler for proper cleanup
    private boundHandleKeyPress: (e: KeyboardEvent) => void;

    /**
     * Initialize shortcut manager
     * Loads shortcuts from config and sets up event listeners
     */
    async init(): Promise<void> {
        // Load user overrides from config
        await this.loadUserOverrides();

        // Register Alt+1-9 shortcuts for switching tabs
        this.registerTabSwitchShortcuts();

        // Register all core commands
        this.registerCoreCommands();

        // Set up global keyboard event listener
        document.addEventListener('keydown', this.boundHandleKeyPress);

        console.log('ShortcutManager initialized with', this.shortcuts.size, 'shortcuts');
    }

    /**
     * Load user customized shortcuts from config
     * Only loads valid user overrides (shortcuts that exist in DEFAULT_SHORTCUTS)
     */
    private async loadUserOverrides(): Promise<void> {
        try {
            const config = await this.app.configManager.loadConfig<{
                shortcuts: Record<string, { keys: string[] }>;
            }>('shortcuts');

            if (config?.shortcuts) {
                for (const [id, shortcut] of Object.entries(config.shortcuts)) {
                    // Only load if:
                    // 1. Has keys array
                    // 2. Is a known shortcut (exists in defaults or is a switch-tab shortcut)
                    const isKnownShortcut =
                        this.defaultShortcuts[id] || id.startsWith('switch-tab-');

                    if (shortcut.keys && Array.isArray(shortcut.keys) && isKnownShortcut) {
                        this.userOverrides.set(id, shortcut.keys);
                    }
                }
            }
        } catch (error) {
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
        }
    }

    /**
     * Register all core commands
     * This centralizes command registration in the core layer
     */
    private registerCoreCommands(): void {
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
                callback: () => {
                    // This will be implemented by the desktop app
                    console.log('New note command - to be implemented by app');
                },
            },
            'core',
        );

        // NOTE: Editor formatting commands are now registered by @inkdown/editor
        // via the registerEditorCommands() function. This keeps editor-specific
        // logic in the editor package while still allowing shortcuts customization.

        // App-level commands (placeholders - will be overridden by desktop app)
        this.registerCommand(
            {
                id: 'app:toggle-sidebar',
                name: 'Toggle Sidebar',
                hotkey: ['Mod', '\\'],
                callback: () => {
                    console.log('Toggle sidebar - to be implemented by app');
                },
            },
            'core',
        );
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
     * Register a command (called by plugins)
     * Core commands have priority over plugin commands
     */
    registerCommand(
        command: Command,
        source: 'core' | 'plugin' = 'plugin',
        pluginId?: string,
    ): void {
        console.log(`[ShortcutManager] registerCommand called:`, {
            commandId: command.id,
            commandName: command.name,
            source,
            pluginId,
            hotkey: command.hotkey,
            hotkeys: command.hotkeys,
        });
        
        this.commands.set(command.id, command);

        // Get default keys from our defaults or from command
        // Support both hotkey (string[]) and hotkeys (Hotkey[]) formats
        const defaultConfig = this.defaultShortcuts[command.id];
        let defaultKeys = defaultConfig?.keys || command.hotkey || [];
        
        // Convert hotkeys format if hotkey is empty but hotkeys exists
        if (defaultKeys.length === 0 && command.hotkeys && command.hotkeys.length > 0) {
            defaultKeys = this.convertHotkeysToKeys(command.hotkeys);
            console.log(`[ShortcutManager] Converted hotkeys to:`, defaultKeys);
        }

        console.log(`[ShortcutManager] defaultKeys:`, defaultKeys);

        if (defaultKeys.length > 0) {
            const existingShortcut = this.shortcuts.get(command.id);
            console.log(`[ShortcutManager] existingShortcut:`, existingShortcut);
            if (!existingShortcut) {
                // Use user override if available, otherwise default
                const effectiveKeys = this.getEffectiveKeys(command.id, defaultKeys);
                console.log(`[ShortcutManager] Registering shortcut with effectiveKeys:`, effectiveKeys);

                this.registerShortcut(
                    command.id,
                    {
                        id: command.id,
                        name: defaultConfig?.name || command.name,
                        keys: effectiveKeys,
                        action: command.id,
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
        this.commands.delete(commandId);
        // Keep the shortcut config for when plugin is re-enabled
    }

    /**
     * Register a shortcut
     * Core shortcuts have priority over plugin shortcuts
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
            console.error(`Shortcut ${id} not found`);
            return;
        }

        // Check for conflicts
        const conflict = this.checkConflict(keys, id);
        if (conflict) {
            throw new Error(`Shortcut conflict: ${keys.join('+')} is already used by ${conflict}`);
        }

        // Update shortcut in memory
        shortcut.keys = [...keys]; // Create new array reference
        this.shortcuts.set(id, { ...shortcut }); // Create new object reference

        // Save user override
        this.userOverrides.set(id, keys);

        // Persist to config file
        await this.saveShortcuts();

        // Notify listeners about the change
        this.notifyChange(id, keys);

        console.log(`Shortcut ${id} updated to:`, keys.join('+'));
    }

    /**
     * Reset a shortcut to its default
     */
    async resetShortcut(id: string): Promise<void> {
        const shortcut = this.shortcuts.get(id);
        if (!shortcut) {
            console.error(`Shortcut ${id} not found`);
            return;
        }

        // Get default keys
        const defaultConfig = this.defaultShortcuts[id];
        if (!defaultConfig) {
            console.warn(`No default found for shortcut ${id}`);
            return;
        }

        // Check for conflicts with default keys
        const conflict = this.checkConflict(defaultConfig.keys, id);
        if (conflict) {
            throw new Error(
                `Cannot reset: default keys ${defaultConfig.keys.join('+')} conflict with ${conflict}`,
            );
        }

        // Update shortcut
        shortcut.keys = [...defaultConfig.keys];
        this.shortcuts.set(id, { ...shortcut });

        // Remove user override
        this.userOverrides.delete(id);

        // Save to config
        await this.saveShortcuts();

        // Notify listeners about the change
        this.notifyChange(id, defaultConfig.keys);

        console.log(`Shortcut ${id} reset to default:`, defaultConfig.keys.join('+'));
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
        // Notify programmatic listeners
        for (const listener of this.changeListeners) {
            try {
                listener(id, keys);
            } catch (error) {
                console.error('Error in shortcut change listener:', error);
            }
        }

        // Dispatch DOM event for React components
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
     * Returns the ID of the conflicting shortcut, or null if no conflict
     */
    checkConflict(keys: string[], excludeId?: string): string | null {
        const normalizedNew = this.normalizeKeys(keys);

        for (const [id, shortcut] of this.shortcuts.entries()) {
            if (excludeId && id === excludeId) continue;

            const normalizedExisting = this.normalizeKeys(shortcut.keys);
            if (normalizedNew === normalizedExisting) {
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

        // Build key combination from event
        const keys: string[] = [];

        // Add modifiers
        if (event.ctrlKey || event.metaKey) {
            keys.push('Mod');
        }
        if (event.altKey) {
            keys.push('Alt');
        }
        if (event.shiftKey) {
            keys.push('Shift');
        }

        // Add main key
        const key = event.key;
        if (key && key.length === 1) {
            keys.push(key.toUpperCase());
        } else if (key) {
            keys.push(key);
        }

        // If no modifier keys, ignore (except for special keys)
        if (!event.ctrlKey && !event.metaKey && !event.altKey) {
            return;
        }

        // Find matching shortcut
        const normalizedKeys = this.normalizeKeys(keys);

        for (const [, shortcut] of this.shortcuts.entries()) {
            const shortcutNormalized = this.normalizeKeys(shortcut.keys);

            if (normalizedKeys === shortcutNormalized) {
                // For editor shortcuts, only execute if we're in the editor
                if (shortcut.action.startsWith('editor:') && !isEditor) {
                    continue;
                }

                // For non-editor shortcuts in input fields, skip unless it's a save/close type shortcut
                if (isInput && !isEditor && !this.isGlobalShortcut(shortcut.action)) {
                    continue;
                }

                // Execute command
                this.executeCommand(shortcut.action);
                event.preventDefault();
                event.stopPropagation();
                return;
            }
        }
    }

    /**
     * Check if a shortcut should work globally (even in input fields)
     */
    private isGlobalShortcut(action: string): boolean {
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

    /**
     * Normalize keys for comparison
     */
    private normalizeKeys(keys: string[]): string {
        return keys
            .map((k) => k.toUpperCase())
            .sort()
            .join('+');
    }

    /**
     * Execute a command by action name
     */
    executeCommand(action: string): void {
        // Handle built-in actions
        if (action.startsWith('switch-tab-')) {
            const tabIndex = Number.parseInt(action.split('-')[2]) - 1;
            this.app.tabManager.switchToTabByIndex(tabIndex);
            return;
        }

        // Execute registered command
        const command = this.commands.get(action);
        if (command) {
            if (command.checkCallback) {
                const canRun = command.checkCallback(true);
                if (canRun) {
                    command.checkCallback(false);
                }
            } else if (command.callback) {
                command.callback();
            }
        } else {
            console.warn(`Command ${action} not found`);
        }
    }

    /**
     * Get all shortcuts
     */
    getAllShortcuts(): (ShortcutConfig & { source: 'core' | 'plugin'; pluginId?: string })[] {
        return Array.from(this.shortcuts.values());
    }

    /**
     * Get shortcut by ID
     */
    getShortcut(id: string): ShortcutConfig | undefined {
        return this.shortcuts.get(id);
    }

    /**
     * Get default keys for a shortcut
     */
    getDefaultKeys(id: string): string[] | undefined {
        return this.defaultShortcuts[id]?.keys;
    }

    /**
     * Check if a shortcut has been customized by user
     */
    isCustomized(id: string): boolean {
        return this.userOverrides.has(id);
    }

    /**
     * Save shortcuts to config
     */
    private async saveShortcuts(): Promise<void> {
        const config: { shortcuts: Record<string, { keys: string[] }> } = {
            shortcuts: {},
        };

        // Only save user overrides (not defaults)
        for (const [id, keys] of this.userOverrides.entries()) {
            config.shortcuts[id] = { keys };
        }

        await this.app.configManager.saveConfig('shortcuts', config);
    }

    /**
     * Cleanup
     */
    cleanup(): void {
        if (this.boundHandleKeyPress) {
            document.removeEventListener('keydown', this.boundHandleKeyPress);
        }
    }
}
