# UI Components & Styling

Inkdown provides a shared UI package (`@inkdown/ui`) and a comprehensive CSS variable system to ensure consistency and ease of development for plugins.

## Core UI Components (`@inkdown/core`)

The core package provides essential UI components for plugin development:

### Modal

Base class for creating modal dialogs:

```typescript
import { Modal } from '@inkdown/core';

class MyModal extends Modal {
    onOpen() {
        const { contentEl } = this;
        contentEl.createEl('h2', { text: 'My Modal' });
        contentEl.createEl('p', { text: 'Hello from the modal!' });
    }
    
    onClose() {
        const { contentEl } = this;
        contentEl.empty();
    }
}

// Usage
const modal = new MyModal(app);
modal.open();
```

### ConfirmModal

Pre-built confirmation dialog:

```typescript
import { ConfirmModal } from '@inkdown/core';

const confirmed = await ConfirmModal.confirm(
    app,
    'Delete File',
    'Are you sure you want to delete this file?'
);

if (confirmed) {
    // Proceed with deletion
}
```

### Notice

Toast notifications:

```typescript
import { Notice } from '@inkdown/core';

// Simple notice (auto-hides after 5 seconds)
new Notice('File saved successfully!');

// Custom duration (3 seconds)
new Notice('Processing...', 3000);

// Persistent notice
const notice = new Notice('Uploading...', 0);
// Later...
notice.hide();
```

### Setting

Component for building settings interfaces:

```typescript
import { Setting } from '@inkdown/core';

// In a PluginSettingTab
display(): void {
    const { containerEl } = this;
    containerEl.empty();
    
    // Text input
    new Setting(containerEl)
        .setName('API Key')
        .setDesc('Enter your API key')
        .addText(text => text
            .setPlaceholder('sk-...')
            .setValue(this.plugin.settings.apiKey)
            .onChange(async (value) => {
                this.plugin.settings.apiKey = value;
                await this.plugin.saveSettings();
            }));
    
    // Toggle
    new Setting(containerEl)
        .setName('Enable Feature')
        .setDesc('Turn this feature on or off')
        .addToggle(toggle => toggle
            .setValue(this.plugin.settings.enabled)
            .onChange(async (value) => {
                this.plugin.settings.enabled = value;
                await this.plugin.saveSettings();
            }));
    
    // Dropdown
    new Setting(containerEl)
        .setName('Theme')
        .setDesc('Choose a color theme')
        .addDropdown(dropdown => dropdown
            .addOption('dark', 'Dark')
            .addOption('light', 'Light')
            .setValue(this.plugin.settings.theme)
            .onChange(async (value) => {
                this.plugin.settings.theme = value;
                await this.plugin.saveSettings();
            }));
    
    // Button
    new Setting(containerEl)
        .setName('Reset Settings')
        .setDesc('Restore default settings')
        .addButton(button => button
            .setButtonText('Reset')
            .setWarning()
            .onClick(async () => {
                await this.plugin.resetSettings();
            }));
}
```

### PluginSettingTab

Base class for plugin settings tabs:

```typescript
import { PluginSettingTab, Setting } from '@inkdown/core';

class MyPluginSettingTab extends PluginSettingTab {
    plugin: MyPlugin;
    
    constructor(app: App, plugin: MyPlugin) {
        super(app, plugin);
        this.plugin = plugin;
    }
    
    display(): void {
        const { containerEl } = this;
        containerEl.empty();
        
        containerEl.createEl('h2', { text: 'My Plugin Settings' });
        
        new Setting(containerEl)
            .setName('Setting Name')
            .setDesc('Description of the setting')
            .addText(text => text
                .setValue(this.plugin.settings.value)
                .onChange(async (value) => {
                    this.plugin.settings.value = value;
                    await this.plugin.saveSettings();
                }));
    }
    
    hide(): void {
        // Called when tab is hidden
    }
}
```

### FuzzySuggestModal

Modal with fuzzy search for selecting items:

```typescript
import { FuzzySuggestModal } from '@inkdown/core';

interface MyItem {
    id: string;
    name: string;
}

class MyFuzzyModal extends FuzzySuggestModal<MyItem> {
    getItems(): MyItem[] {
        return [
            { id: '1', name: 'First Item' },
            { id: '2', name: 'Second Item' },
        ];
    }
    
    getItemText(item: MyItem): string {
        return item.name;
    }
    
    onChooseItem(item: MyItem, evt: MouseEvent | KeyboardEvent): void {
        console.log('Selected:', item.name);
    }
}
```

### EditorSuggest

Autocomplete suggestions in the editor:

```typescript
import { EditorSuggest, EditorSuggestContext, EditorSuggestTriggerInfo } from '@inkdown/core';

class MySuggest extends EditorSuggest<string> {
    onTrigger(cursor, editor, file): EditorSuggestTriggerInfo | null {
        const line = editor.state.doc.line(cursor.line + 1);
        const match = line.text.match(/@(\w*)$/);
        
        if (match) {
            return {
                start: { line: cursor.line, ch: match.index! },
                end: cursor,
                query: match[1]
            };
        }
        return null;
    }
    
    getSuggestions(context: EditorSuggestContext): string[] {
        const names = ['Alice', 'Bob', 'Charlie'];
        return names.filter(n => 
            n.toLowerCase().includes(context.query.toLowerCase())
        );
    }
    
    renderSuggestion(item: string, el: HTMLElement): void {
        el.createEl('span', { text: item });
    }
    
    selectSuggestion(item: string, evt: MouseEvent | KeyboardEvent): void {
        // Insert the selected item
        this.context?.editor.dispatch({
            changes: {
                from: this.context.start,
                to: this.context.end,
                insert: `@${item} `
            }
        });
    }
}

// Register in onload()
this.registerEditorSuggest(new MySuggest(this.app));
```

## UI Package (`@inkdown/ui`)

The UI package contains reusable React components for building consistent interfaces:

### Key Components

| Component | Description |
|-----------|-------------|
| `Button` | Standard buttons with variants (primary, secondary, danger) |
| `Input` | Text inputs with various types |
| `Checkbox` | Checkbox input with label |
| `Toggle` | Toggle switch component |
| `Dropdown` | Select dropdown |
| `Modal` | React-based modal container |
| `Tabs` | Tab navigation component |

### Usage in React

```tsx
import { Button, Input, Toggle } from '@inkdown/ui';

function MyComponent() {
    return (
        <div>
            <Input 
                placeholder="Enter text..."
                onChange={(e) => console.log(e.target.value)}
            />
            <Toggle 
                checked={enabled}
                onChange={setEnabled}
            />
            <Button variant="primary" onClick={handleClick}>
                Save
            </Button>
        </div>
    );
}
```

## CSS Architecture

Inkdown uses a centralized CSS architecture based on CSS variables. This ensures easy theming and consistent styling.

### Using CSS Variables

Plugins should **always** use CSS variables instead of hardcoded values for theme compatibility:

```css
.my-plugin-element {
    /* ✅ Good - uses CSS variables */
    background: var(--bg-secondary);
    color: var(--text-primary);
    border: 1px solid var(--border-color);
    border-radius: var(--radius-md);
}

.my-plugin-element:hover {
    background: var(--bg-tertiary);
}

.my-plugin-element.active {
    border-color: var(--color-primary);
}
```

### Common Variables

| Variable | Description |
|----------|-------------|
| `--color-primary` | Main accent color |
| `--color-primary-hover` | Accent hover state |
| `--color-success` | Success/positive color |
| `--color-warning` | Warning color |
| `--color-danger` | Error/danger color |
| `--bg-primary` | Main background |
| `--bg-secondary` | Secondary background (panels) |
| `--bg-tertiary` | Tertiary background (hover states) |
| `--bg-sidebar` | Sidebar background |
| `--text-primary` | Main text color |
| `--text-secondary` | Secondary text |
| `--text-muted` | Muted/disabled text |
| `--border-color` | Standard border color |
| `--radius-sm` | Small border radius (2px) |
| `--radius-md` | Medium border radius (4px) |
| `--radius-lg` | Large border radius (8px) |

### Injecting Styles

Use `addStyle()` to inject CSS that's automatically cleaned up:

```typescript
async onload() {
    this.addStyle(`
        .my-plugin-container {
            padding: 16px;
            background: var(--bg-secondary);
            border-radius: var(--radius-md);
        }
        
        .my-plugin-title {
            color: var(--text-primary);
            font-weight: 600;
            margin-bottom: 8px;
        }
        
        .my-plugin-button {
            background: var(--color-primary);
            color: var(--button-primary-text);
            padding: 6px 12px;
            border-radius: var(--radius-sm);
            cursor: pointer;
        }
        
        .my-plugin-button:hover {
            background: var(--color-primary-hover);
        }
    `);
}
```

## Icons

Use the `setIcon` utility to add icons:

```typescript
import { setIcon } from '@inkdown/core';

// In your plugin
const iconEl = document.createElement('div');
await setIcon(iconEl, 'folder');

// Or with a status bar item
const statusBar = this.addStatusBarItem();
await setIcon(statusBar, 'file-text');
statusBar.appendText(' Notes');
```

## Related Documentation

- [Plugin System](./system.md)
- [CSS Architecture](../styling/css-architecture.md)
- [Creating Themes](../styling/creating-themes.md)
