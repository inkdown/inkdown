# @inkdown/plugin-api

TypeScript definitions for Inkdown plugin development.

## Installation

```bash
npm install @inkdown/plugin-api --save-dev
# or
bun add @inkdown/plugin-api --dev
```

## Usage

Create a plugin by extending the `Plugin` class:

```typescript
import { Plugin, Notice, Setting, PluginSettingTab } from '@inkdown/plugin-api';

interface MyPluginSettings {
  mySetting: string;
}

const DEFAULT_SETTINGS: MyPluginSettings = {
  mySetting: 'default'
};

export default class MyPlugin extends Plugin {
  settings: MyPluginSettings;

  async onload() {
    // Load settings
    await this.loadSettings();

    // Add a command
    this.addCommand({
      id: 'my-command',
      name: 'My Command',
      callback: () => {
        new Notice('Hello from my plugin!');
      }
    });

    // Add a settings tab
    this.addSettingTab(new MyPluginSettingTab(this.app, this));
  }

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }

  async onunload() {
    // Cleanup (optional)
  }
}

class MyPluginSettingTab extends PluginSettingTab {
  plugin: MyPlugin;

  constructor(app: App, plugin: MyPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();

    new Setting(containerEl)
      .setName('My Setting')
      .setDesc('Description of my setting')
      .addText(text => text
        .setValue(this.plugin.settings.mySetting)
        .onChange(async (value) => {
          this.plugin.settings.mySetting = value;
          await this.plugin.saveSettings();
        }));
  }
}
```

## API Reference

### Core Classes

- **`Plugin`** - Base class for all plugins
- **`Component`** - Base class for lifecycle management
- **`ItemView`** - Base class for custom views

### UI Components

- **`Modal`** - Base class for modal dialogs
- **`ConfirmModal`** - Yes/no confirmation modal
- **`FuzzySuggestModal`** - Modal with fuzzy search
- **`Notice`** - Toast notifications
- **`Setting`** - Settings UI builder
- **`PluginSettingTab`** - Plugin settings tab

### Editor

- **`EditorSuggest`** - In-editor autocomplete
- **`IEditor`** - Editor interface

### Events

- **`Events`** - Event emitter base class
- **`EventRef`** - Event reference for cleanup

### Markdown Processing

- **`MarkdownCodeBlockProcessor`** - Process code blocks
- **`MarkdownPostProcessor`** - Post-process rendered markdown

## Plugin Structure

Your plugin should have the following files:

```
my-plugin/
├── manifest.json    # Plugin metadata
├── main.js          # Compiled plugin code
├── styles.css       # Optional styles
└── README.md        # Documentation
```

### manifest.json

```json
{
  "id": "my-plugin",
  "name": "My Plugin",
  "version": "1.0.0",
  "minAppVersion": "0.1.0",
  "description": "A description of my plugin",
  "author": "Your Name",
  "authorUrl": "https://github.com/yourusername"
}
```

## Building Your Plugin

We recommend using [esbuild](https://esbuild.github.io/) for building:

```javascript
// esbuild.config.mjs
import esbuild from 'esbuild';

esbuild.build({
  entryPoints: ['main.ts'],
  bundle: true,
  external: ['@inkdown/plugin-api'],
  format: 'cjs',
  target: 'es2020',
  outfile: 'main.js',
});
```

## License

MIT
