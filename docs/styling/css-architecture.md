# CSS Architecture

Inkdown's CSS architecture is designed for modularity, cross-platform compatibility (desktop & future mobile), and comprehensive theme support using CSS custom properties (variables).

## Structure

Styles are centralized in `@inkdown/core` to be shared across all platforms:

```
packages/core/src/styles/
├── index.css                    # Entry point (imports everything)
├── variables.css                # Global CSS variables (Theming API)
├── base.css                     # Reset & base element styles
├── themes/                      # Default themes
│   ├── default-dark.css
│   └── default-light.css
├── icons.css                    # Icon system
├── plugin-api.css               # Plugin UI components (Modals, Settings)
└── popover-suggest.css          # Suggestion popovers & autocomplete
```

## Platform-Specific Styles

Platform-specific apps define only layout-specific styles:

```
apps/desktop/src/styles/
├── app.css                      # Desktop layout (grid, sidebar, main)
├── FileExplorer.css             # File explorer sidebar
└── components/
    └── EditorModes.css          # Editor/Preview layout modes
```

## Theme Application

Themes are applied via CSS class selectors on the `documentElement`:

```html
<!-- Dark mode -->
<html class="theme-dark">

<!-- Light mode -->
<html class="theme-light">
```

The `ThemeManager` handles switching between modes and injecting custom theme CSS.

### Custom Themes

Custom themes inject their CSS into a `<style id="inkdown-custom-theme">` element:

```typescript
// ThemeManager injects custom theme CSS
const styleEl = document.createElement('style');
styleEl.id = 'inkdown-custom-theme';
styleEl.textContent = cssContent;
document.head.appendChild(styleEl);
```

## CSS Variables Reference

### Background Colors

| Variable | Description | Dark Default |
|----------|-------------|--------------|
| `--bg-primary` | Main background | `#1e1e1e` |
| `--bg-secondary` | Secondary panels | `#262626` |
| `--bg-sidebar` | Sidebar background | `#1a1a1a` |
| `--bg-tertiary` | Tertiary/hover elements | `#2a2a2a` |

### Text Colors

| Variable | Description | Dark Default |
|----------|-------------|--------------|
| `--text-primary` | Main text color | `#dcdcdc` |
| `--text-secondary` | Secondary text | `#8c8c8c` |
| `--text-muted` | Muted/disabled text | `#686868` |

### UI Colors

| Variable | Description | Dark Default |
|----------|-------------|--------------|
| `--color-primary` | Accent/primary color | `#6c99bb` |
| `--color-primary-hover` | Primary hover state | `#7daccc` |
| `--color-primary-alpha` | Primary with transparency | `rgba(108, 153, 187, 0.15)` |
| `--color-success` | Success state | `#a8c373` |
| `--color-warning` | Warning state | `#e5b567` |
| `--color-danger` | Error/danger state | `#d04255` |
| `--border-color` | Standard borders | `#373737` |

### Editor Colors

| Variable | Description |
|----------|-------------|
| `--editor-bg` | Editor background |
| `--editor-fg` | Editor foreground text |
| `--editor-selection` | Selection highlight |
| `--editor-cursor` | Cursor color |
| `--editor-active-line` | Active line highlight |
| `--editor-line-number` | Line number color |
| `--editor-scrollbar` | Scrollbar color |

### Heading Styles

| Variable | Description |
|----------|-------------|
| `--heading-font-weight` | Heading font weight |
| `--heading-line-height` | Heading line height |
| `--heading-h1` through `--heading-h6` | Heading colors |
| `--heading-h1-size` through `--heading-h6-size` | Heading sizes |

### Syntax Highlighting (Markdown)

| Variable | Description |
|----------|-------------|
| `--syntax-header` | Markdown headers |
| `--syntax-bold` / `--syntax-strong` | Bold text |
| `--syntax-italic` / `--syntax-emphasis` | Italic text |
| `--syntax-strikethrough` | Strikethrough text |
| `--syntax-link` / `--syntax-url` | Links |
| `--syntax-code` / `--syntax-monospace` | Inline code |
| `--syntax-quote` | Blockquotes |
| `--syntax-list` | List markers |
| `--syntax-separator` | Horizontal rules |

### Code Block Syntax

| Variable | Description |
|----------|-------------|
| `--code-bg` | Code block background |
| `--code-text` | Code text color |
| `--code-keyword` | Keywords (if, else, etc.) |
| `--code-string` | String literals |
| `--code-comment` | Comments |
| `--code-function` | Function names |
| `--code-number` | Numbers |
| `--code-operator` | Operators |
| `--code-atom` | Atoms/constants |
| `--code-bool` | Booleans |
| `--code-regexp` | Regular expressions |
| `--code-meta` | Meta/annotations |
| `--code-punctuation` | Punctuation |

### CodeMirror Editor

| Variable | Description |
|----------|-------------|
| `--cm-comment` | Comment color |
| `--cm-keyword` | Keyword color |
| `--cm-string` | String color |
| `--cm-number` | Number color |
| `--cm-operator` | Operator color |
| `--cm-punctuation` | Punctuation |
| `--cm-function` | Function names |
| `--cm-property` | Property names |
| `--cm-variable` | Variables |
| `--cm-type` | Type names |
| `--cm-tag` | HTML/XML tags |
| `--cm-attribute` | Attributes |
| `--cm-heading-marker` | Markdown heading `#` markers |
| `--cm-list-marker` | List markers |
| `--cm-quote-marker` | Quote `>` markers |
| `--cm-link-bracket` | Link brackets `[]()` |
| `--cm-link-text` | Link text |
| `--cm-link` | Link color |
| `--cm-link-hover` | Link hover color |
| `--cm-link-url` | Link URL color |

### UI Elements

| Variable | Description |
|----------|-------------|
| `--button-primary-bg` | Primary button background |
| `--button-primary-text` | Primary button text |
| `--button-secondary-bg` | Secondary button background |
| `--button-secondary-text` | Secondary button text |
| `--input-bg` | Input background |
| `--input-border` | Input border |
| `--input-focus-border` | Input focus border |
| `--tab-bg` | Tab background |
| `--tab-bg-active` | Active tab background |
| `--tab-border-active` | Active tab border |

### Sizing & Typography

| Variable | Description |
|----------|-------------|
| `--code-font-size` | Code font size |
| `--code-padding` | Inline code padding |
| `--code-border-radius` | Code border radius |
| `--quote-border-width` | Quote border width |
| `--quote-padding-left` | Quote left padding |
| `--quote-margin-left` | Quote left margin |
| `--scrollbar-width` | Scrollbar width |
| `--scrollbar-border-radius` | Scrollbar radius |
| `--font-family-mono` | Monospace font stack |
| `--radius-sm` | Small border radius (2px) |
| `--radius-md` | Medium border radius (4px) |
| `--radius-lg` | Large border radius (8px) |

## Best Practices

### 1. Always Use Variables

Never hardcode colors or dimensions:

```css
/* ❌ Bad */
.my-element {
    background: #1e1e1e;
    color: #ffffff;
}

/* ✅ Good */
.my-element {
    background: var(--bg-secondary);
    color: var(--text-primary);
}
```

### 2. Provide Fallbacks for Critical Values

```css
.my-element {
    color: var(--color-primary, #007bff);
}
```

### 3. Test Both Themes

Always verify your styles work in both dark and light modes.

### 4. Use Semantic Variable Names

Choose variables that describe the purpose, not the value:
- Use `--bg-secondary` not `--dark-gray`
- Use `--color-danger` not `--red`

### 5. Component-Scoped Styles

Keep component-specific styles co-located or in dedicated files:

```css
/* In your plugin's addStyle() */
.my-plugin-container { ... }
.my-plugin-title { ... }
.my-plugin-button { ... }
```

## Related Documentation

- [Creating Themes](./creating-themes.md)
- [Theme System](../architecture/theme-system.md)
- [UI Components](../plugins/ui-components.md)

