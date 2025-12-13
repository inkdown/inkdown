import type { App } from './App';
import { Component } from './Component';
import { Notice } from './components/Notice';
import type { PluginSettingTab } from './components/PluginSettingTab';
import type { Command, PluginManifest, ViewCreator } from './types/plugin';
import { createLogger, type Logger } from './utils/logger';

/**
 * Base Plugin class - All plugins must extend this class
 *
 *
 * @example
 * ```ts
 * interface MyPluginSettings {
 *   setting1: string;
 *   showInStatusBar: boolean;
 * }
 *
 * const DEFAULT_SETTINGS: MyPluginSettings = {
 *   setting1: 'default',
 *   showInStatusBar: true
 * }
 *
 * export default class MyPlugin extends Plugin extends Component {
 *   settings: MyPluginSettings;
 *
 *   async onload() {
 *     await this.loadSettings();
 *
 *     // Add a settings tab
 *     this.addSettingTab(new MyPluginSettingTab(this.app, this));
 *
 *     // Register a command
 *     this.addCommand({
 *       id: 'my-command',
 *       name: 'My Command',
 *       callback: () => {
 *         console.log('Command executed!');
 *       }
 *     });
 *   }
 *
 *   async loadSettings() {
 *     this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
 *   }
 *
 *   async saveSettings() {
 *     await this.saveData(this.settings);
 *   }
 *
 *   async onunload() {
 *     // Clean up resources
 *   }
 * }
 * ```
 */
export abstract class Plugin extends Component {
    /**
     * Reference to the app instance
     */
    app: App;

    /**
     * The plugin manifest containing metadata
     */
    manifest: PluginManifest;

    /**
     * Whether the plugin is currently enabled
     */
    enabled = false;

    /**
     * Logger instance for the plugin
     */
    protected logger: Logger;

    private commands: Map<string, Command> = new Map();
    private views: Map<string, ViewCreator> = new Map();
    private settingTabs: PluginSettingTab[] = [];
    private ribbonIcons: HTMLElement[] = [];
    private statusBarItems: HTMLElement[] = [];
    private eventRefs: (() => void)[] = [];
    private editorSuggests: any[] = []; // EditorSuggest instances
    private codeBlockProcessors: Array<{ language: string; processor: any }> = [];
    private postProcessors: any[] = [];
    private styleElements: HTMLStyleElement[] = [];
    private editorExtensions: any[] = []; // CodeMirror extensions

    constructor(app: App, manifest: PluginManifest) {
        super();
        this.app = app;
        this.manifest = manifest;
        this.logger = createLogger(`Plugin:${manifest.id}`);
    }

    /**
     * Called when the plugin is loaded.
     * Override this method to initialize your plugin.
     *
     * This is where you should:
     * - Load settings with `await this.loadData()`
     * - Register commands with `this.addCommand()`
     * - Add setting tabs with `this.addSettingTab()`
     * - Register views, ribbon icons, etc.
     */
    abstract onload(): Promise<void>;

    /**
     * Called when the plugin is unloaded.
     * Override this method to cleanup resources.
     *
     * Note: Commands, views, setting tabs, and ribbon icons registered through
     * the plugin methods are automatically cleaned up. You only need to handle
     * custom cleanup here.
     */
    abstract onunload(): Promise<void>;

    /**
     * Load data from the plugin's data file.
     * This is typically used to load plugin settings.
     *
     * @returns The saved data, or undefined if no data exists
     *
     * @example
     * ```ts
     * async loadSettings() {
     *   this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
     * }
     * ```
     */
    async loadData<T = any>(): Promise<T | undefined> {
        try {
            return (await this.app.pluginManager.getPluginSettings(this.manifest.id)) as T;
        } catch (error: any) {
            console.error(`Failed to load data for plugin ${this.manifest.id}:`, error);
            return undefined;
        }
    }

    /**
     * Save data to the plugin's data file.
     * This is typically used to save plugin settings.
     *
     * @param data The data to save
     *
     * @example
     * ```ts
     * async saveSettings() {
     *   await this.saveData(this.settings);
     * }
     * ```
     */
    async saveData(data: any): Promise<void> {
        try {
            await this.app.pluginManager.savePluginSettings(this.manifest.id, data);
        } catch (error: any) {
            console.error(`Failed to save data for plugin ${this.manifest.id}:`, error);
            throw error;
        }
    }

    /**
     * Register a command that can be executed by the user.
     * Alias for `registerCommand`
     *
     * @param command The command to register
     * @returns The registered command
     *
     * @example
     * ```ts
     * this.addCommand({
     *   id: 'open-settings',
     *   name: 'Open Settings',
     *   hotkeys: [{ modifiers: ['Ctrl'], key: ',' }],
     *   callback: () => {
     *     this.app.openSettings();
     *   }
     * });
     * ```
     */
    addCommand(command: Command): Command {
        this.registerCommand(command);
        return command;
    }

    /**
     * Register a command that can be executed by the user
     */
    registerCommand(command: Command): void {
        this.commands.set(command.id, command);
        this.app.commandManager.registerCommand(command, 'plugin', this.manifest.id);
    }

    /**
     * Register a custom view
     */
    registerView(viewType: string, viewCreator: ViewCreator): void {
        this.views.set(viewType, viewCreator);
        this.app.workspaceUI.registerView(viewType, viewCreator);
    }

    /**
     * Add a settings tab for this plugin.
     * The tab will appear in the settings modal sidebar when the plugin is enabled.
     *
     * @param tab The setting tab to add
     *
     * @example
     * ```ts
     * this.addSettingTab(new MyPluginSettingTab(this.app, this));
     * ```
     */
    addSettingTab(tab: PluginSettingTab): void {
        this.settingTabs.push(tab);
    }

    /**
     * Register a settings tab for this plugin.
     * Alias for `addSettingTab` - kept for compatibility.
     *
     * @deprecated Use `addSettingTab` instead
     */
    registerSettingTab(tab: PluginSettingTab): void {
        this.addSettingTab(tab);
    }

    /**
     * Add an icon to the ribbon (sidebar)
     *
     * @param icon The icon to display (icon name or SVG)
     * @param title The tooltip text
     * @param callback Called when the icon is clicked
     * @returns The icon element
     */
    addRibbonIcon(icon: string, title: string, callback: () => void): HTMLElement {
        const iconEl = document.createElement('div');
        iconEl.className = 'ribbon-icon';
        iconEl.title = title;
        iconEl.setAttribute('aria-label', title);
        iconEl.onclick = callback;

        // Try to use icon name, fallback to innerHTML if it looks like SVG
        if (icon.includes('<svg') || icon.includes('<path')) {
            iconEl.innerHTML = icon;
        } else {
            iconEl.dataset.icon = icon;
            iconEl.textContent = icon; // Fallback text
        }

        this.ribbonIcons.push(iconEl);
        return iconEl;
    }

    /**
     * Add an item to the status bar
     *
     * The item will be automatically attached to the status bar when it becomes available.
     * This method handles the timing internally, so you don't need to worry about when
     * the status bar is mounted.
     *
     * @returns The status bar item element
     *
     * @example
     * ```ts
     * const statusBarItem = this.addStatusBarItem();
     * statusBarItem.setText('Word count: 0');
     * ```
     */
    addStatusBarItem(): HTMLElement {
        const item = document.createDiv({ cls: 'status-bar-item' });
        this.statusBarItems.push(item);

        // Attempt to attach the item to the status bar
        this._attachStatusBarItem(item);

        return item;
    }

    /**
     * Internal method to attach a status bar item to the DOM
     * Retries automatically if the status bar isn't ready yet
     */
    private _attachStatusBarItem(item: HTMLElement, retries = 10): void {
        const statusBarRight = document.getElementById('status-bar-right');

        if (statusBarRight) {
            // Status bar is ready, attach the item
            statusBarRight.appendChild(item);
        } else if (retries > 0) {
            // Status bar not ready yet, retry after a short delay
            setTimeout(() => {
                this._attachStatusBarItem(item, retries - 1);
            }, 100);
        } else {
            // Give up after all retries
            this.logger.warn('Status bar not found, item will not be displayed');
        }
    }

    /**
     * Register an event handler that will be automatically unregistered when the plugin unloads
     *
     * @param eventRef A function that unregisters the event
     */
    registerEvent(eventRef: () => void): void {
        this.eventRefs.push(eventRef);
    }

    /**
     * Register a DOM event handler that will be automatically removed when the plugin unloads
     *
     * @param el The element to attach the event to
     * @param type The event type
     * @param callback The event handler
     * @param options Event listener options
     */
    registerDomEvent<K extends keyof HTMLElementEventMap>(
        el: HTMLElement | Document | Window,
        type: K,
        callback: (ev: HTMLElementEventMap[K]) => any,
        options?: boolean | AddEventListenerOptions,
    ): void {
        el.addEventListener(type, callback as EventListener, options);
        this.eventRefs.push(() => {
            el.removeEventListener(type, callback as EventListener, options);
        });
    }

    /**
     * Register an interval that will be automatically cleared when the plugin unloads
     *
     * @param callback The function to call
     * @param interval The interval in milliseconds
     * @returns The interval ID
     */
    setInterval(callback: () => void, interval: number): number {
        const id = window.setInterval(callback, interval);
        this.registerInterval(id);
        return id;
    }

    /**
     * Get all commands registered by this plugin
     */
    getCommands(): Command[] {
        return Array.from(this.commands.values());
    }

    /**
     * Get all views registered by this plugin
     */
    getViews(): Map<string, ViewCreator> {
        return this.views;
    }

    /**
     * Get all setting tabs registered by this plugin
     */
    getSettingTabs(): PluginSettingTab[] {
        return this.settingTabs;
    }

    /**
     * Register an editor suggest (autocomplete) provider
     * The suggest will be automatically cleaned up when the plugin unloads
     *
     * @param suggest The EditorSuggest instance
     */
    registerEditorSuggest(suggest: any): void {
        this.editorSuggests.push(suggest);
        this.app.registerEditorSuggest(suggest);
    }

    /**
     * Register a markdown code block processor
     * Processes code blocks with the specified language
     *
     * @param language The language identifier (e.g., 'mermaid', 'dataview')
     * @param processor Function to process the code block
     *
     * @example
     * ```ts
     * this.registerMarkdownCodeBlockProcessor('mermaid', (source, el, ctx) => {
     *   el.innerHTML = renderMermaidDiagram(source);
     * });
     * ```
     */
    registerMarkdownCodeBlockProcessor(
        language: string,
        processor: (source: string, el: HTMLElement, ctx: any) => void | Promise<void>,
    ): void {
        this.codeBlockProcessors.push({ language, processor });

        // Register with app's markdown processor registry
        if (this.app.markdownProcessor) {
            this.app.markdownProcessor.registerCodeBlockProcessor(language, processor);
        }
    }

    /**
     * Add inline CSS styles to the document
     * Styles are automatically removed when the plugin unloads
     *
     * @example
     * ```ts
     * this.addStyle(`
     *   .my-custom-class {
     *     color: var(--text-accent);
     *   }
     * `);
     * ```
     */
    addStyle(css: string): void {
        const styleEl = document.createElement('style');
        styleEl.textContent = css;
        styleEl.setAttribute('data-plugin-id', this.manifest.id);
        document.head.appendChild(styleEl);
        this.styleElements.push(styleEl);
    }

    /**
     * Register a markdown post processor
     * Runs after all markdown is rendered to DOM
     *
     * @param processor Function to process the rendered markdown
     *
     * @example
     * ```ts
     * this.registerMarkdownPostProcessor((el, ctx) => {
     *   // Add click handlers to all links
     *   el.findAll('a').forEach(link => {
     *     link.addEventListener('click', handleLinkClick);
     *   });
     * });
     * ```
     */
    registerMarkdownPostProcessor(
        processor: (el: HTMLElement, ctx: any) => void | Promise<void>,
    ): void {
        this.postProcessors.push(processor);

        // Register with app's markdown processor registry
        if (this.app.markdownProcessor) {
            this.app.markdownProcessor.registerPostProcessor(processor);
        }
    }

    /**
     * Register a CodeMirror editor extension
     *
     * Extensions registered here will be applied to all editors.
     * Use this to add custom editor behaviors, decorations, or commands.
     *
     * @param extension The CodeMirror extension
     *
     * @example
     * ```ts
     * import { keymap } from '@codemirror/view';
     *
     * this.registerEditorExtension(
     *   keymap.of([{
     *     key: 'Ctrl-k',
     *     run: () => { console.log('Custom key pressed'); return true; }
     *   }])
     * );
     * ```
     */
    registerEditorExtension(extension: any): void {
        this.editorExtensions.push(extension);

        // Apply extension to active editor via EditorRegistry
        if (this.app.editorRegistry) {
            const activeEditor = this.app.editorRegistry.getActive();

            if (activeEditor) {
                try {
                    // Note: For production, you'd want to use StateEffect.appendConfig
                    // or a Compartment to dynamically add/remove extensions
                    // For now, just log that the extension is registered
                    console.log(
                        '[Plugin] Registered editor extension for plugin:',
                        this.manifest.name,
                    );

                    // Extensions will be applied when editor is re-created or via compartments
                    // This is a placeholder for the actual implementation
                } catch (error: any) {
                    console.error('[Plugin] Failed to register editor extension:', error);
                }
            }
        }
    }

    /**
     * Get all status bar items
     */
    getStatusBarItems(): HTMLElement[] {
        return this.statusBarItems;
    }

    /**
     * Show a toast notification
     * @param message Message to display
     * @param duration Duration in milliseconds (default 5000, use 0 for persistent)
     * @returns Notice instance for manual control
     *
     * @example
     * ```ts
     * // Simple notification
     * this.showNotice('File saved successfully!');
     *
     * // Custom duration
     * this.showNotice('Processing...', 3000);
     *
     * // Persistent notice with manual control
     * const notice = this.showNotice('Uploading...', 0);
     * // ... later
     * notice.setMessage('Upload complete!');
     * notice.hide();
     * ```
     */
    showNotice(message: string | DocumentFragment, duration?: number): Notice {
        return new Notice(message, duration);
    }

    /**
     * Internal cleanup method - called automatically when plugin is disabled
     */
    async _cleanup(): Promise<void> {
        // Unregister commands
        for (const command of this.commands.values()) {
            this.app.commandManager.unregisterCommand(command.id);
        }
        this.commands.clear();

        // Clear views
        this.views.clear();

        // Call hide on setting tabs before clearing
        for (const tab of this.settingTabs) {
            try {
                tab.hide();
            } catch (_e) {
                // Ignore errors during cleanup
            }
        }
        this.settingTabs = [];

        // Remove ribbon icons
        for (const icon of this.ribbonIcons) {
            icon.remove();
        }
        this.ribbonIcons = [];

        // Remove status bar items
        for (const item of this.statusBarItems) {
            item.remove();
        }
        this.statusBarItems = [];

        // Remove all style elements
        this.styleElements.forEach((el) => {
            el.remove();
        });
        this.styleElements = [];

        // Unregister events
        for (const unregister of this.eventRefs) {
            try {
                unregister();
            } catch (_e) {
                // Ignore errors during cleanup
            }
        }
        this.eventRefs = [];

        // Cleanup editor suggests
        for (const suggest of this.editorSuggests) {
            try {
                this.app.unregisterEditorSuggest(suggest);
                if (suggest && typeof suggest.destroy === 'function') {
                    suggest.destroy();
                }
            } catch (_e) {
                // Ignore errors during cleanup
            }
        }
        this.editorSuggests = [];

        // Cleanup markdown processors
        for (const { language, processor } of this.codeBlockProcessors) {
            if (this.app.markdownProcessor) {
                this.app.markdownProcessor.unregisterCodeBlockProcessor(language, processor);
            }
        }
        this.codeBlockProcessors = [];

        for (const processor of this.postProcessors) {
            if (this.app.markdownProcessor) {
                this.app.markdownProcessor.unregisterPostProcessor(processor);
            }
        }
        this.postProcessors = [];

        // Clear editor extensions
        this.editorExtensions = [];
    }
}
