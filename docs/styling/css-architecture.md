# CSS Architecture

Inkdown's CSS architecture is designed for modularity, reusability (desktop & mobile), and theme support.

## Structure

Styles are centralized in `@inkdown/core` to be shared across platforms.

```
packages/core/src/styles/
├── index.css                    # Entry point (imports everything)
├── variables.css                # Global CSS variables (Theming API)
├── base.css                     # Reset & base styles
├── themes/                      # Default themes
│   ├── default-dark.css
│   └── default-light.css
├── icons.css                    # Icon system
├── plugin-api.css               # UI components (Modals, Settings)
└── popover-suggest.css          # Suggestion popovers
```

## Platform Specifics

Platform-specific apps (like Desktop) only define layout-specific styles.

```
apps/desktop/src/styles/
└── app.css                      # Desktop layout (grid, flex structure)

apps/desktop/src/components/
└── EditorModes.css              # Editor/Preview layout modes
```

## Theme Application

Themes are applied via CSS class selectors on the `documentElement`:

```html
<!-- Dark mode -->
<html class="theme-dark">

<!-- Light mode -->
<html class="theme-light">
```

Custom themes inject their CSS into a `<style id="inkdown-custom-theme">` element.

## CSS Variables Reference

### Background Colors

| Variable | Description | Example (Dark) |
|----------|-------------|----------------|
| `--bg-primary` | Main background | `#1e1e1e` |
| `--bg-secondary` | Secondary panels | `#262626` |
| `--bg-sidebar` | Sidebar background | `#1a1a1a` |
| `--bg-tertiary` | Tertiary elements | `#2a2a2a` |

### Text Colors

| Variable | Description | Example (Dark) |
|----------|-------------|----------------|
| `--text-primary` | Main text color | `#dcdcdc` |
| `--text-secondary` | Secondary text | `#8c8c8c` |
| `--text-muted` | Muted/disabled text | `#686868` |

### UI Colors

| Variable | Description | Example (Dark) |
|----------|-------------|----------------|
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

### Syntax Highlighting

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

### Code Block Colors

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

### CodeMirror Specific

| Variable | Description |
|----------|-------------|
| `--cm-comment` | CM comment color |
| `--cm-keyword` | CM keyword color |
| `--cm-string` | CM string color |
| `--cm-number` | CM number color |
| `--cm-operator` | CM operator color |
| `--cm-punctuation` | CM punctuation |
| `--cm-function` | CM function names |
| `--cm-property` | CM property names |
| `--cm-variable` | CM variables |
| `--cm-type` | CM type names |
| `--cm-tag` | CM HTML/XML tags |
| `--cm-attribute` | CM attributes |
| `--cm-heading-marker` | Markdown heading markers |
| `--cm-list-marker` | List markers |
| `--cm-quote-marker` | Quote markers |
| `--cm-link-bracket` | Link brackets |
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

### Sizing & Spacing

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

## Creating Custom Themes

Custom themes should be placed in the themes directory:

```
~/Library/Application Support/com.furqas.inkdown/themes/
└── my-theme/
    ├── manifest.json
    ├── dark.css
    ├── light.css
    └── README.md
```

### Theme CSS Structure

```css
/**
 * My Theme for Inkdown
 */

.theme-dark {
    /* Background Colors */
    --bg-primary: #1d2021;
    --bg-secondary: #282828;
    --bg-sidebar: #282828;
    --bg-tertiary: #32302f;

    /* Text Colors */
    --text-primary: #ebdbb2;
    --text-secondary: #d5c4a1;
    --text-muted: #928374;

    /* Border & UI */
    --border-color: #665c54;
    --color-primary: #fe8019;
    --color-primary-hover: #fabd2f;
    --color-primary-alpha: rgba(254, 128, 25, 0.15);
    --color-success: #b8bb26;
    --color-warning: #fabd2f;
    --color-danger: #fb4934;

    /* ... all other variables ... */
}
```

See [Theme System](../architecture/theme-system.md) for complete theme documentation.

## Guidelines

1. **Use Variables**: Never hardcode colors or dimensions. Use `var(--variable-name)`.
2. **Mobile First**: Core styles should be responsive or platform-agnostic.
3. **Component Scoping**: Component-specific styles should be co-located with the component or in a dedicated file in core if shared.
4. **Theme Compatibility**: Always test styles against both Dark and Light themes.
5. **Fallbacks**: Provide fallback values for critical variables: `var(--color-primary, #007bff)`

