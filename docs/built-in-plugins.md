# Built-in Plugins

Inkdown comes with several built-in plugins that provide essential functionality. These plugins serve as examples of how to build features using the Plugin API and are located in `packages/plugins/`.

## Available Plugins

### 1. Word Count

**ID**: `word-count`

Displays word and character count in the status bar.

**Features**:
- Real-time word count updates (every 500ms)
- Character count (with/without spaces option)
- Configurable via Settings tab
- Cleans markdown syntax for accurate counting

**Settings**:
| Setting | Description | Default |
|---------|-------------|---------|
| Show Word Count | Display word count in status bar | `true` |
| Show Character Count | Display character count in status bar | `false` |
| Count Spaces | Include spaces in character count | `false` |

**Code Example**:
```typescript
// From WordCountPlugin.ts
const statusBarItem = this.addStatusBarItem();
statusBarItem.setText(`${wordCount} words`);
```

---

### 2. Quick Finder

**ID**: `quick-finder`

Quick file search and navigation (similar to VS Code's Ctrl+P).

**Features**:
- Fuzzy search by file name and path
- Keyboard navigation (↑↓ to navigate, Enter to open)
- Open files in current or new tab
- Create new notes with Shift+Enter
- Recently opened files shown first

**Default Shortcut**: `Mod+O` (Cmd+O / Ctrl+O)

**Code Example**:
```typescript
// From QuickFinderPlugin.ts
this.addCommand({
    id: 'quick-finder:open',
    name: 'Open Quick Finder',
    hotkey: ['Mod', 'o'],
    callback: () => this.openQuickFinder()
});
```

---

### 3. Slash Commands

**ID**: `slash-commands`

Provides a slash command menu in the editor for quick formatting.

**Features**:
- Type `/` to trigger the menu
- Insert headings (H1-H3)
- Insert bullet and numbered lists
- Insert blockquotes
- Insert code blocks
- Insert task lists (to-do)
- Insert horizontal dividers
- Fuzzy search within menu

**Available Commands**:
| Command | Description | Output |
|---------|-------------|--------|
| Heading 1 | Big section heading | `# ` |
| Heading 2 | Medium section heading | `## ` |
| Heading 3 | Small section heading | `### ` |
| Bullet List | Simple bullet list | `- ` |
| Numbered List | Numbered list | `1. ` |
| Quote | Blockquote | `> ` |
| Code Block | Code snippet | ` ``` ` |
| To-do List | Task checkbox | `- [ ] ` |
| Divider | Horizontal rule | `---` |

**Code Example**:
```typescript
// From SlashCommandsPlugin.ts
class SlashCommandSuggest extends EditorSuggest<SlashCommand> {
    onTrigger(cursor, editor, file) {
        const line = editor.state.doc.line(cursor.line + 1);
        const match = line.text.match(/(?:^|\s)\/$/);
        if (match) {
            return { start: cursor, end: cursor, query: '' };
        }
        return null;
    }
}
```

---

### 4. Live Preview

**ID**: `live-preview`

Renders markdown elements in real-time within the editor.

**Features**:
- Bold and italic formatting rendered inline
- Headings displayed with proper sizing
- Links rendered as clickable widgets
- Inline code with hidden backticks
- Lists with styled markers
- Blockquotes with hidden `>` markers
- Selection-aware (shows syntax when cursor is inside)
- Viewport-optimized for performance

**How It Works**:

The Live Preview plugin enables a CodeMirror extension that decorates the editor content. The editor component checks if this plugin is enabled:

```typescript
// In Editor component
if (app.pluginManager.isPluginEnabled('live-preview')) {
    // Apply live preview decorations
}
```

---

## Plugin Architecture

Built-in plugins follow the same architecture as community plugins:

```
packages/plugins/src/
├── index.ts                    # Exports all plugins
├── word-count/
│   ├── index.ts
│   ├── manifest.json
│   ├── WordCountPlugin.ts
│   └── WordCountSettingTab.ts
├── quick-finder/
│   ├── index.ts
│   ├── manifest.json
│   ├── QuickFinderPlugin.ts
│   └── QuickFinderModal.ts
├── slash-commands/
│   ├── index.ts
│   ├── manifest.json
│   ├── SlashCommandsPlugin.ts
│   └── SlashCommandsSettingTab.ts
└── live-preview/
    ├── index.ts
    ├── manifest.json
    ├── LivePreviewPlugin.ts
    └── livePreviewExtension.ts
```

## Registration

Built-in plugins are registered during App initialization:

```typescript
// packages/plugins/src/index.ts
export function getBuiltInPlugins(): PluginInfo[] {
    return [
        {
            manifest: wordCountManifest,
            isBuiltIn: true,
            loader: async () => ({ default: WordCountPlugin }),
        },
        {
            manifest: livePreviewManifest,
            isBuiltIn: true,
            loader: async () => ({ default: LivePreviewPlugin }),
        },
        {
            manifest: quickFinderManifest,
            isBuiltIn: true,
            loader: async () => ({ default: QuickFinderPlugin }),
        },
        {
            manifest: slashCommandsManifest,
            isBuiltIn: true,
            loader: async () => ({ default: SlashCommandsPlugin }),
        },
    ];
}

// In desktop app (main.tsx)
import { getBuiltInPlugins } from '@inkdown/plugins';
const app = new App(getBuiltInPlugins());
```

## Creating New Built-in Plugins

1. Create a new folder in `packages/plugins/src/`
2. Create `manifest.json` with plugin metadata
3. Create the main plugin class extending `Plugin`
4. Export from the folder's `index.ts`
5. Add to `getBuiltInPlugins()` in the main index
6. Add to `packages/plugins/package.json` if needed

## Related Documentation

- [Plugin System](./plugins/system.md)
- [Community Plugins](./plugins/community-plugins.md)
