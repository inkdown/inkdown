import type { App } from '@inkdown/core';
import { PluginSettingTab, Setting } from '@inkdown/core';
import type SlashCommandsPlugin from './SlashCommandsPlugin';

export class SlashCommandsSettingTab extends PluginSettingTab {
    plugin: SlashCommandsPlugin;

    constructor(app: App, plugin: SlashCommandsPlugin) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display(): void {
        const { containerEl } = this;
        containerEl.empty();

        new Setting(containerEl).setName('Slash Commands Settings').setHeading();

        new Setting(containerEl)
            .setName('Enable Slash Commands')
            .setDesc('Type / to trigger the command menu')
            .addToggle((toggle) =>
                toggle
                    .setValue(this.plugin.settings.enableSlashCommands)
                    .onChange(async (value) => {
                        this.plugin.settings.enableSlashCommands = value;
                        await this.plugin.saveSettings();
                    }),
            );
    }
}
