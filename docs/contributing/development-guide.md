# Development Guide

This guide covers the technical details of working with the Inkdown codebase.

## Architecture Overview

Inkdown is a monorepo built with:

- **Tauri** - Desktop framework (Rust backend)
- **React** - UI framework
- **TypeScript** - Type-safe JavaScript
- **CodeMirror 6** - Text editor engine
- **Bun** - Package manager and runtime

### Package Structure

```
inkdown/
├── apps/
│   └── desktop/              # Tauri desktop application
│       ├── src/              # React frontend
│       └── src-tauri/        # Rust backend
├── packages/
│   ├── core/                 # @inkdown/core - Business logic
│   ├── ui/                   # @inkdown/ui - Shared components
│   ├── plugins/              # @inkdown/plugins - Built-in plugins
│   ├── native-tauri/         # @inkdown/native-tauri - Platform bridge
│   └── plugin-api/           # @inkdown/plugin-api - Type definitions
└── docs/                     # Documentation
```

### Package Dependencies

```mermaid
graph TD
    Desktop[apps/desktop] --> Core[@inkdown/core]
    Desktop --> UI[@inkdown/ui]
    Desktop --> Plugins[@inkdown/plugins]
    Desktop --> Native[@inkdown/native-tauri]
    
    Plugins --> Core
    Plugins --> UI
    UI --> Core
    Native --> Core
```

---

## Core Concepts

### App Class

The `App` class is the central hub that initializes and coordinates all managers:

```typescript
class App {
    workspace: Workspace;           // File operations
    workspaceUI: WorkspaceUI;       // UI state (tabs, active file)
    pluginManager: PluginManager;   // Plugin lifecycle
    configManager: ConfigManager;   // Persistent storage
    themeManager: ThemeManager;     // Theme management
    editorRegistry: EditorRegistry; // Editor instances
    commandManager: CommandManager; // Commands & shortcuts
}
```

### Managers

Each manager handles a specific domain:

| Manager | Responsibility |
|---------|---------------|
| `Workspace` | File CRUD operations, file tree |
| `WorkspaceUI` | Tabs, active file, views |
| `PluginManager` | Load, enable, disable plugins |
| `ConfigManager` | JSON config file I/O |
| `ThemeManager` | Theme loading and CSS injection |
| `EditorRegistry` | Track CodeMirror instances |
| `CommandManager` | Register and execute commands |
| `KeybindingManager` | Keyboard shortcut handling |

### Event System

Managers communicate via events:

```typescript
// Subscribe to events
app.workspace.on('file-created', (file) => {
    console.log('New file:', file.path);
});

// Emit events
this.trigger('file-created', newFile);
```

---

## Working with Packages

### @inkdown/core

The core package contains all business logic. It's platform-agnostic.

**Key exports:**
- `App` - Main application class
- `Plugin` - Base class for plugins
- `Editor` - React editor component
- Managers (ConfigManager, ThemeManager, etc.)
- Types and interfaces

### @inkdown/ui

Shared React components with consistent styling.

**Key exports:**
- `Button`, `Input`, `Select` - Form elements
- `Modal`, `Setting` - Layout components
- `TabBar`, `StatusBar` - App chrome
- `FileExplorer` - File tree component

### @inkdown/plugins

Built-in plugins that ship with Inkdown.

**Plugins:**
- `live-preview` - WYSIWYG-like rendering
- `quick-finder` - File search (Ctrl+P)
- `slash-commands` - Insert commands
- `word-count` - Word/character statistics

### @inkdown/native-tauri

Platform-specific implementations using Tauri APIs.

**Adapters:**
- `TauriFileSystem` - File operations
- `TauriDialog` - Native dialogs
- `TauriClipboard` - Clipboard access
- `TauriConfig` - Config file paths

---

## Creating a Plugin

Plugins extend the `Plugin` class:

```typescript
import { Plugin } from '@inkdown/core';

export default class MyPlugin extends Plugin {
    async onload() {
        // Register commands
        this.addCommand({
            id: 'my-command',
            name: 'Do Something',
            callback: () => this.doSomething()
        });
        
        // Add settings tab
        this.addSettingTab(new MySettingTab(this.app, this));
        
        // Add status bar item
        const statusItem = this.addStatusBarItem();
        statusItem.setText('Hello!');
    }
    
    async onunload() {
        // Cleanup
    }
}
```

See [Plugin System Documentation](../plugins/system.md) for details.

---

## Editor Extensions

The editor uses CodeMirror 6. Extensions are added via the plugin system:

```typescript
import { Extension } from '@codemirror/state';

// In your plugin
this.registerEditorExtension(myExtension);
```

Common extension types:
- `ViewPlugin` - DOM manipulation
- `StateField` - Custom state
- `Decoration` - Visual decorations
- `keymap` - Key bindings

---

## Styling Guide

### CSS Variables

Always use CSS variables for theming:

```css
.my-component {
    background: var(--bg-secondary);
    color: var(--text-primary);
    border: 1px solid var(--border-color);
}
```

### Component Styles

Place CSS files next to components:

```
components/
├── MyComponent.tsx
└── MyComponent.css
```

Import in the component:

```typescript
import './MyComponent.css';
```

### CSS Architecture

See [CSS Architecture Documentation](../styling/css-architecture.md) for the full variable reference.

---

## Testing

### Running Tests

```bash
# Run all tests
bun test

# Run tests in watch mode
bun test --watch

# Run specific test file
bun test src/utils/parser.test.ts
```

### Writing Tests

Use Vitest for unit tests:

```typescript
import { describe, it, expect } from 'vitest';
import { parseMarkdown } from './parser';

describe('parseMarkdown', () => {
    it('should parse headings', () => {
        const result = parseMarkdown('# Hello');
        expect(result.headings).toHaveLength(1);
    });
});
```

---

## Debugging

### Developer Tools

Open DevTools in the running app:
- `Ctrl+Shift+I` (Windows/Linux)
- `Cmd+Option+I` (macOS)

### Logging

Use the logger utility:

```typescript
import { createLogger } from '@inkdown/core';

const logger = createLogger('MyPlugin');
logger.info('Plugin loaded');
logger.error('Something went wrong', error);
```

### Rust Backend

View Tauri logs in the terminal where you ran `bun run dev`.

---

## Build & Release

### Development Build

```bash
bun run dev
```

### Production Build

```bash
bun run build
```

### Creating a Release

Releases are automated via GitHub Actions when you push a tag:

```bash
git tag v0.1.0
git push origin v0.1.0
```

---

## Common Tasks

### Adding a New Command

1. Register in a plugin or manager:

```typescript
app.commandManager.registerCommand({
    id: 'my:command',
    name: 'My Command',
    hotkey: ['Mod', 'Shift', 'M'],
    callback: () => { /* ... */ }
}, 'source-id');
```

### Adding a Config Option

1. Define the type in the config interface
2. Add default value
3. Load/save via ConfigManager:

```typescript
const config = await app.configManager.loadConfig<MyConfig>('my-config');
await app.configManager.saveConfig('my-config', newConfig);
```

### Adding a UI Component

1. Create component in `@inkdown/ui`
2. Export from `packages/ui/src/index.ts`
3. Import in the app or plugin

---

## Resources

- [Architecture Overview](../architecture/README.md)
- [Plugin System](../plugins/system.md)
- [CSS Architecture](../styling/css-architecture.md)
- [CodeMirror 6 Documentation](https://codemirror.net/docs/)
- [Tauri Documentation](https://tauri.app/v1/guides/)
