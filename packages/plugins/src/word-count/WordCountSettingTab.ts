import type { App } from '@inkdown/core';
import { PluginSettingTab, Setting } from '@inkdown/core';
import type WordCountPlugin from './WordCountPlugin';

/**
 * Word Count Settings Tab
 *
 *
 * @example
 * ```ts
 * // In your plugin's onload():
 * this.addSettingTab(new WordCountSettingTab(this.app, this));
 * ```
 */
export class WordCountSettingTab extends PluginSettingTab {
    plugin: WordCountPlugin;

    constructor(app: App, plugin: WordCountPlugin) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display(): void {
        const { containerEl } = this;
        containerEl.empty();

        // Heading
        new Setting(containerEl).setName('Word Count Settings').setHeading();

        // Show word count toggle
        new Setting(containerEl)
            .setName('Show word count')
            .setDesc('Display the number of words in the current note')
            .addToggle((toggle) =>
                toggle.setValue(this.plugin.settings.showWordCount).onChange(async (value) => {
                    this.plugin.settings.showWordCount = value;
                    await this.plugin.saveSettings();
                }),
            );

        // Show character count toggle
        new Setting(containerEl)
            .setName('Show character count')
            .setDesc('Display the number of characters in the current note')
            .addToggle((toggle) =>
                toggle.setValue(this.plugin.settings.showCharCount).onChange(async (value) => {
                    this.plugin.settings.showCharCount = value;
                    await this.plugin.saveSettings();
                }),
            );

        // Count spaces toggle
        new Setting(containerEl)
            .setName('Count spaces in character count')
            .setDesc('Include spaces when counting characters')
            .addToggle((toggle) =>
                toggle.setValue(this.plugin.settings.countSpaces).onChange(async (value) => {
                    this.plugin.settings.countSpaces = value;
                    await this.plugin.saveSettings();
                }),
            );
    }
}
