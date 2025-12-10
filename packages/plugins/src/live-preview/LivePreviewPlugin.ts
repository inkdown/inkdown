import { Plugin } from '@inkdown/core';

/**
 * Live Preview Plugin - Renders markdown elements in real-time
 *
 * This plugin implements live preview functionality,
 * hiding markdown syntax and rendering formatted elements while editing.
 *
 * Features:
 * - Bold (**text**) and italic (*text*) formatting
 * - Headings with hidden markers
 * - Links with clickable widgets
 * - Inline code with hidden backticks
 * - Lists with styled markers
 * - Blockquotes with hidden markers
 * - Selection-aware rendering (shows syntax when cursor is inside)
 * - Viewport-based optimization for performance
 *
 * Note: The Live Preview extension is integrated directly into the Editor component.
 * The editor checks if this plugin is enabled before applying the extension.
 */
export default class LivePreviewPlugin extends Plugin {
    async onload(): Promise<void> {
        console.log('LivePreviewPlugin loaded');
        this.showNotice('Live Preview plugin loaded!', 1000);
        // The Live Preview extension is integrated directly into the Editor component
        // The editor will check if this plugin is enabled via app.pluginManager.isPluginEnabled('live-preview')
        // and only apply the extension if enabled
    }

    async onunload(): Promise<void> {
        console.log('LivePreviewPlugin unloaded');
        // The editor will automatically stop applying the extension when this plugin is disabled
    }
}
