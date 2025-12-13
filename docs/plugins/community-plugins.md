# Community Plugins

Inkdown supports community plugins that extend the application's functionality. This guide covers how to create, install, and publish community plugins.

## Overview

Community plugins are JavaScript bundles that use the Inkdown Plugin API. They are loaded dynamically from the user's configuration directory and have access to the same capabilities as built-in plugins.

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

### Using the Inkdown CLI (Recommended)

The fastest way to create a new plugin is using the Inkdown CLI:

```bash
# Install the CLI
go install github.com/inkdown/inkdown-cli@latest

# Create a new plugin
inkdown-cli plugin create my-plugin
cd my-plugin

# Install dependencies
npm install

# Start development
npm run dev
```

### Manual Setup

#### 1. Project Setup

Create a new directory for your plugin and initialize it:

```bash
mkdir my-inkdown-plugin
cd my-inkdown-plugin
npm init -y
npm install --save-dev typescript esbuild
```

#### 2. Configure TypeScript

Create a `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "declaration": true,
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "outDir": "./dist"
  },
  "include": ["src/**/*"]
}
```

#### 3. Create the Manifest

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

#### 4. Write Your Plugin

Create `src/main.ts`:

```typescript
import { Plugin, Notice, PluginSettingTab, Setting } from '@inkdown/core';

interface MyPluginSettings {
  greeting: string;
  enabled: boolean;
}

const DEFAULT_SETTINGS: MyPluginSettings = {
  greeting: 'Hello, World!',
  enabled: true
};

export default class MyPlugin extends Plugin {
  settings: MyPluginSettings = DEFAULT_SETTINGS;

  async onload() {
    console.log('Loading My Plugin');
    
    // Load settings
    await this.loadSettings();

    // Add a command
    this.addCommand({
      id: 'show-greeting',
      name: 'Show Greeting',
      callback: () => {
        this.showNotice(this.settings.greeting);
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

  async loadSettings() {
    this.settings = { ...DEFAULT_SETTINGS, ...await this.loadData() };
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }
}

class MyPluginSettingTab extends PluginSettingTab {
  plugin: MyPlugin;

  constructor(app: any, plugin: MyPlugin) {
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
        
    new Setting(containerEl)
      .setName('Enable Feature')
      .setDesc('Toggle this feature on or off')
      .addToggle(toggle => toggle
        .setValue(this.plugin.settings.enabled)
        .onChange(async (value) => {
          this.plugin.settings.enabled = value;
          await this.plugin.saveSettings();
        }));
  }
}
```

#### 5. Configure esbuild

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
  
  // Editor
  EditorAdapter,
  
  // Utilities
  setIcon,
} from '@inkdown/core';
```

### Plugin Methods

| Method | Description |
|--------|-------------|
| `onload()` | Called when the plugin is enabled. Initialize your plugin here. |
| `onunload()` | Called when the plugin is disabled. Cleanup is automatic. |
| `loadData<T>()` | Load plugin settings from persistent storage |
| `saveData(data)` | Save plugin settings to persistent storage |
| `addCommand(command)` | Register a command for Command Palette and shortcuts |
| `addSettingTab(tab)` | Add a settings tab to the Settings modal |
| `addStatusBarItem()` | Add an item to the status bar |
| `addRibbonIcon(icon, title, callback)` | Add an icon to the sidebar ribbon |
| `addStyle(css)` | Inject CSS (auto-removed on unload) |
| `registerEditorSuggest(suggest)` | Register an autocomplete provider |
| `registerMarkdownCodeBlockProcessor(lang, fn)` | Process custom code blocks |
| `registerMarkdownPostProcessor(fn)` | Post-process rendered markdown |
| `registerEditorExtension(extension)` | Add CodeMirror extension |
| `registerEvent(unsubscribe)` | Track event for auto-cleanup |
| `registerDomEvent(el, type, callback)` | DOM event with auto-cleanup |
| `registerInterval(id)` | Track interval for auto-cleanup |
| `showNotice(message, duration?)` | Show a toast notification |

### Command Interface

```typescript
interface Command {
  id: string;           // Unique identifier
  name: string;         // Display name
  callback: () => void; // Function to execute
  hotkey?: string[];    // e.g., ['Mod', 'Shift', 'p']
  icon?: string;        // Icon name
}
```

## Installing Community Plugins

### Manual Installation

1. Download the plugin files (`main.js`, `manifest.json`, and optionally `styles.css`)
2. Create a folder in your plugins directory with the plugin ID:
   - macOS: `~/Library/Application Support/com.furqas.inkdown/plugins/plugin-id/`
   - Windows: `%APPDATA%\com.furqas.inkdown\plugins\plugin-id\`
   - Linux: `~/.config/com.furqas.inkdown/plugins/plugin-id/`
3. Copy the files into the folder
4. Restart Inkdown or go to Settings → Plugins and enable the plugin

### Via Community Plugin Browser

The Community Plugin Browser allows you to browse, install, and update plugins directly from within Inkdown:

1. Open Settings (Cmd/Ctrl + ,)
2. Go to "Community Plugins"
3. Click "Browse" to see available plugins
4. Click "Install" on any plugin you want

## Security Considerations

Community plugins run in the same context as the application and have access to:
- The file system (through the Workspace API)
- Network requests (through standard browser APIs)
- The DOM (for UI modifications)
- Plugin settings storage

**⚠️ Only install plugins from trusted sources.**

## Publishing Your Plugin

To publish your plugin to the Inkdown community:

1. **Host on GitHub**: Create a public repository for your plugin
2. **Create a Release**: Tag a release with the following files:
   - `main.js` (bundled plugin)
   - `manifest.json` (plugin metadata)
   - `styles.css` (optional, for custom styles)
3. **Submit to Registry**: Submit a PR to the [community-plugins repository](https://github.com/inkdown-app/community-plugins)

### Release Checklist

- [ ] `manifest.json` has correct `id`, `name`, `version`, `minAppVersion`
- [ ] `main.js` is bundled with esbuild and working
- [ ] `README.md` describes your plugin with screenshots
- [ ] `LICENSE` file included (MIT recommended)
- [ ] No hardcoded paths or user-specific data
- [ ] Error handling for edge cases
- [ ] Tested enable/disable lifecycle
- [ ] Uses CSS variables for theming compatibility

## Related Documentation

- [Plugin System](./system.md)
- [UI Components](./ui-components.md)
- [Built-in Plugins](../built-in-plugins.md)
