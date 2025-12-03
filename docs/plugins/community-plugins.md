# Community Plugins

Inkdown supports community plugins that extend the application's functionality. This guide covers how to create, install, and manage community plugins.

## Overview

Community plugins are JavaScript bundles that use the Inkdown Plugin API. They are loaded from the user's configuration directory and have access to the same capabilities as built-in plugins.

### Directory Structure

```
~/Library/Application Support/com.furqas.inkdown/
└── plugins/
    └── plugin-id/
        ├── manifest.json    # Plugin manifest (required)
        ├── main.js          # Plugin bundle (required)
        └── styles.css       # Plugin styles (optional)
```

## Creating a Community Plugin

### 1. Project Setup

Create a new directory for your plugin and initialize it:

```bash
mkdir my-inkdown-plugin
cd my-inkdown-plugin
npm init -y
npm install --save-dev typescript esbuild @inkdown/core
```

### 2. Configure TypeScript

Create a `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2018",
    "module": "ESNext",
    "moduleResolution": "node",
    "declaration": true,
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "outDir": "./dist"
  },
  "include": ["src/**/*"]
}
```

### 3. Create the Manifest

Create a `manifest.json` in your project root:

```json
{
  "id": "my-plugin",
  "name": "My Plugin",
  "version": "1.0.0",
  "minAppVersion": "0.1.0",
  "description": "A sample community plugin for Inkdown",
  "author": "Your Name",
  "authorUrl": "https://github.com/yourusername",
  "repo": "yourusername/my-inkdown-plugin"
}
```

### 4. Write Your Plugin

Create `src/main.ts`:

```typescript
import { Plugin, Notice, PluginSettingTab, Setting } from '@inkdown/core';

interface MyPluginSettings {
  greeting: string;
}

const DEFAULT_SETTINGS: MyPluginSettings = {
  greeting: 'Hello, World!'
};

export default class MyPlugin extends Plugin {
  settings: MyPluginSettings;

  async onload() {
    console.log('Loading My Plugin');
    
    // Load settings
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());

    // Add a command
    this.addCommand({
      id: 'show-greeting',
      name: 'Show Greeting',
      callback: () => {
        new Notice(this.settings.greeting);
      }
    });

    // Add a status bar item
    const statusBarItem = this.addStatusBarItem();
    statusBarItem.setText('My Plugin');

    // Add settings tab
    this.addSettingTab(new MyPluginSettingTab(this.app, this));
  }

  async onunload() {
    console.log('Unloading My Plugin');
  }

  async saveSettings() {
    await this.saveData(this.settings);
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
      .setName('Greeting')
      .setDesc('The greeting message to display')
      .addText(text => text
        .setPlaceholder('Enter greeting')
        .setValue(this.plugin.settings.greeting)
        .onChange(async (value) => {
          this.plugin.settings.greeting = value;
          await this.plugin.saveSettings();
        }));
  }
}
```

### 5. Configure esbuild

Create `esbuild.config.mjs`:

```javascript
import esbuild from "esbuild";
import process from "process";

const prod = process.argv[2] === "production";

const context = await esbuild.context({
  entryPoints: ["src/main.ts"],
  bundle: true,
  external: [
    "@inkdown/core",
    // Add any other external dependencies here
  ],
  format: "cjs",
  target: "es2018",
  logLevel: "info",
  sourcemap: prod ? false : "inline",
  treeShaking: true,
  outfile: "main.js",
  minify: prod,
});

if (prod) {
  await context.rebuild();
  process.exit(0);
} else {
  await context.watch();
}
```

### 6. Build Your Plugin

Add build scripts to `package.json`:

```json
{
  "scripts": {
    "dev": "node esbuild.config.mjs",
    "build": "node esbuild.config.mjs production"
  }
}
```

Build your plugin:

```bash
npm run build
```

This creates `main.js` in your project root.

## Plugin API Reference

### Available Imports

Community plugins can import the following from `@inkdown/core`:

```typescript
import {
  // Base classes
  Plugin,
  Component,
  
  // UI Components
  Modal,
  ConfirmModal,
  Notice,
  Setting,
  PluginSettingTab,
  FuzzySuggestModal,
  PopoverSuggest,
  EditorSuggest,
  
  // Views
  ItemView,
} from '@inkdown/core';
```

### Plugin Lifecycle

| Method | Description |
|--------|-------------|
| `onload()` | Called when the plugin is enabled. Initialize your plugin here. |
| `onunload()` | Called when the plugin is disabled. Clean up resources here. |

### Common Methods

| Method | Description |
|--------|-------------|
| `addCommand(command)` | Register a command |
| `addSettingTab(tab)` | Add a settings tab |
| `addStatusBarItem()` | Add a status bar item |
| `addRibbonIcon(icon, title, callback)` | Add a sidebar icon |
| `registerEditorSuggest(suggest)` | Register an autocomplete provider |
| `registerMarkdownCodeBlockProcessor(lang, processor)` | Process code blocks |
| `registerEditorExtension(extension)` | Add CodeMirror extension |
| `loadData()` | Load plugin settings |
| `saveData(data)` | Save plugin settings |
| `showNotice(message, duration?)` | Show a toast notification |

## Installing Community Plugins

### Manual Installation

1. Download the plugin files (`main.js`, `manifest.json`, and optionally `styles.css`)
2. Create a folder in your plugins directory with the plugin ID
3. Copy the files into the folder
4. Restart Inkdown or reload plugins

### Via Community Plugin Browser

*(Coming soon)*

The Community Plugin Browser will allow you to browse, install, and update plugins directly from within Inkdown.

## Security Considerations

Community plugins run in the same context as the application and have access to:
- The file system (through the Workspace API)
- Network requests (through standard browser APIs)
- The DOM (for UI modifications)

**Only install plugins from trusted sources.**

## Publishing Your Plugin

To publish your plugin to the Inkdown community:

1. Host your plugin on GitHub
2. Create a release with `main.js`, `manifest.json`, and `styles.css` (if applicable)
3. Submit a PR to the [community-plugins repository](https://github.com/inkdown-app/community-plugins)

### Release Checklist

- [ ] `manifest.json` has correct `id`, `name`, `version`
- [ ] `main.js` is bundled and working
- [ ] `README.md` describes your plugin
- [ ] `LICENSE` file included
- [ ] No hardcoded paths or user-specific data
- [ ] Error handling for edge cases
