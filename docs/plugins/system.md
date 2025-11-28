# Plugin System

Inkdown features a powerful plugin system that allows developers to extend the application's functionality. The system is designed to be modular and safe, plugin architecture.

## Plugin Structure

A plugin is a class that extends the base `Plugin` class from `@inkdown/core`.

```typescript
import { Plugin } from '@inkdown/core';

export default class MyPlugin extends Plugin {
    async onload() {
        // Called when the plugin is loaded
        console.log('MyPlugin loaded');
        
        // Register commands, settings, views, etc.
    }

    async onunload() {
        // Called when the plugin is disabled
        console.log('MyPlugin unloaded');
    }
}
```

## Capabilities

Plugins can interact with the application in various ways:

### 1. Commands
Register commands that can be triggered via the Command Palette or keyboard shortcuts.

```typescript
this.addCommand({
    id: 'my-command',
    name: 'Execute My Command',
    callback: () => {
        console.log('Command executed');
    }
});
```

### 2. Settings
Add a settings tab to the application's settings modal.

```typescript
this.addSettingTab(new MyPluginSettingTab(this.app, this));
```

### 3. Editor Interaction
Interact with the active editor to read or modify content.

```typescript
const editor = this.app.workspace.activeEditor;
if (editor) {
    editor.replaceSelection('Hello from plugin!');
}
```

### 4. File System
Perform file operations using the Workspace API.

```typescript
// Create a new file
await this.app.workspace.create('notes/new-note.md', '# New Note');

// Read a file
const file = this.app.workspace.getActiveFile();
if (file) {
    const content = await this.app.workspace.read(file);
}
```

### 5. UI Components
Register new views or add items to the status bar.

```typescript
// Add status bar item
const item = this.addStatusBarItem();
item.setText('My Status');
```

## Plugin Lifecycle

1.  **Load**: The `App` loads all plugins found in the plugins directory (or built-in registry).
2.  **Initialize**: The plugin class is instantiated.
3.  **onload**: The `onload` method is called. This is where most initialization logic should go.
4.  **Usage**: The plugin is active and responds to events/commands.
5.  **onunload**: When the plugin is disabled or the app closes, `onunload` is called to clean up resources (event listeners, UI elements).

## Built-in vs. Community Plugins

*   **Built-in Plugins**: Core features like File Explorer, Search, and Slash Commands are implemented as plugins. They are bundled with the application.
*   **Community Plugins**: (Future) Third-party plugins that can be installed by users.
