import type { App } from '../App';
import type { Plugin } from '../Plugin';

/**
 * PluginSettingTab - Base class for plugin settings tabs
 *
 * Extend this class and implement display() to create a settings tab for your plugin.
 *
 * @example
 * ```ts
 * class MyPluginSettingTab extends PluginSettingTab {
 *   plugin: MyPlugin
 *
 *   constructor(app: App, plugin: MyPlugin) {
 *     super(app, plugin)
 *     this.plugin = plugin
 *   }
 *
 *   display(): void {
 *     const { containerEl } = this
 *     containerEl.empty()
 *
 *     new Setting(containerEl)
 *       .setName('My Setting')
 *       .setDesc('Description of my setting')
 *       .addToggle(toggle => toggle
 *         .setValue(this.plugin.settings.mySetting)
 *         .onChange(async (value) => {
 *           this.plugin.settings.mySetting = value
 *           await this.plugin.saveData(this.plugin.settings)
 *         }))
 *   }
 * }
 * ```
 */
export abstract class PluginSettingTab {
    /**
     * Reference to the app instance
     */
    app: App;

    /**
     * Reference to the plugin that owns this settings tab
     */
    plugin: Plugin;

    /**
     * The container element where settings should be rendered.
     * Use this.containerEl in display() to add your settings.
     */
    containerEl: HTMLElement;

    /**
     * The name displayed in the settings sidebar.
     * If not set, will use the plugin's name from manifest.
     */
    name: string;

    constructor(app: App, plugin: Plugin) {
        this.app = app;
        this.plugin = plugin;
        this.containerEl = document.createElement('div');
        this.containerEl.addClass('plugin-setting-tab');
        this.name = plugin.manifest?.name || 'Plugin Settings';
    }

    /**
     * Called when the settings tab is displayed.
     * Override this method to build your settings UI.
     *
     * Typically you should:
     * 1. Clear the container: `this.containerEl.empty()`
     * 2. Create settings using `new Setting(this.containerEl)`
     */
    abstract display(): void;

    /**
     * Called when the settings tab is hidden.
     * Override this to clean up any resources if needed.
     */
    hide(): void {
        // Default implementation does nothing
        // Override if cleanup is needed
    }
}

// Extensions are now loaded globally via core/src/index.ts -> core/src/extensions.ts

export default PluginSettingTab;
