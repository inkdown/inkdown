# Built-in Plugins

Inkdown comes with several built-in plugins that provide essential functionality. These plugins serve as examples of how to build powerful features using the Plugin API.

## List of Plugins

### 1. File Explorer
**Description**: Provides the file tree view in the sidebar.
**Features**:
*   Navigate folders and files.
*   Create, rename, delete, move files.
*   Context menus for file operations.
*   Drag and drop support.

### 2. Search
**Description**: Global search functionality.
**Features**:
*   Search across all files in the workspace.
*   Display results with context.
*   Navigate to search results.

### 3. Slash Commands
**Description**: Provides a slash command menu in the editor.
**Features**:
*   Type `/` to open the menu.
*   Insert headers, lists, tables, etc.
*   Extensible by other plugins.

### 4. Word Count
**Description**: Displays word and character count in the status bar.
**Features**:
*   Real-time updates.
*   Configurable settings.

### 5. Quick Finder (Ctrl+P)
**Description**: Quick file switcher.
**Features**:
*   Fuzzy search for files.
*   Open files via keyboard.

## Architecture

Built-in plugins are located in `packages/plugins/`. They are registered in `App.ts` during initialization.

```typescript
// App.ts
import { FileExplorerPlugin } from '@inkdown/plugins';

// ...
this.pluginManager.registerPlugin(FileExplorerPlugin);
```
