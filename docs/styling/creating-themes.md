# Creating a Custom Theme

This guide walks you through creating a custom theme for Inkdown.

## Prerequisites

- Inkdown installed
- Basic knowledge of CSS
- A text editor

## Quick Start with CLI

The fastest way to create a theme is using the Inkdown CLI:

```bash
# Install the CLI
go install github.com/inkdown/inkdown-cli@latest

# Create a new theme
inkdown-cli theme create my-theme

# Follow the prompts to customize your theme
```

## Manual Setup

### Step 1: Create the Theme Directory

Create a new folder in the themes directory:

```bash
# macOS
mkdir -p ~/Library/Application\ Support/com.furqas.inkdown/themes/my-theme

# Windows
mkdir %APPDATA%\com.furqas.inkdown\themes\my-theme

# Linux
mkdir -p ~/.config/com.furqas.inkdown/themes/my-theme
```

## Step 2: Create manifest.json

Create a `manifest.json` file with your theme's metadata:

```json
{
  "name": "My Theme",
  "author": "Your Name",
  "version": "1.0.0",
  "description": "A beautiful custom theme for Inkdown",
  "homepage": "https://github.com/yourusername/my-theme",
  "modes": ["dark", "light"]
}
```

**Fields:**
- `name` (required): Display name shown in the theme browser
- `author` (required): Your name or username
- `version` (required): Semantic version (e.g., "1.0.0")
- `description` (optional): Brief description of your theme
- `homepage` (optional): Link to your theme's repository
- `modes` (required): Array of supported modes - `["dark"]`, `["light"]`, or `["dark", "light"]`

## Step 3: Create CSS Files

Create CSS files for each mode you support.

### dark.css

```css
/**
 * My Theme - Dark Mode
 */

.theme-dark {
    /* ========== BACKGROUND COLORS ========== */
    --bg-primary: #1a1b26;
    --bg-secondary: #24283b;
    --bg-sidebar: #1f2335;
    --bg-tertiary: #292e42;

    /* ========== TEXT COLORS ========== */
    --text-primary: #c0caf5;
    --text-secondary: #a9b1d6;
    --text-muted: #565f89;

    /* ========== BORDER & UI ========== */
    --border-color: #3b4261;
    --color-primary: #7aa2f7;
    --color-primary-hover: #89b4fa;
    --color-primary-alpha: rgba(122, 162, 247, 0.15);
    --color-success: #9ece6a;
    --color-warning: #e0af68;
    --color-danger: #f7768e;

    /* ========== EDITOR ========== */
    --editor-bg: #1a1b26;
    --editor-fg: #c0caf5;
    --editor-selection: rgba(122, 162, 247, 0.3);
    --editor-cursor: #c0caf5;
    --editor-active-line: #292e42;
    --editor-line-number: #3b4261;
    --editor-scrollbar: #3b4261;

    /* ========== HEADINGS ========== */
    --heading-font-weight: 600;
    --heading-line-height: 1.4;
    --heading-h1: #f7768e;
    --heading-h1-size: 1.8em;
    --heading-h2: #ff9e64;
    --heading-h2-size: 1.5em;
    --heading-h3: #e0af68;
    --heading-h3-size: 1.25em;
    --heading-h4: #9ece6a;
    --heading-h4-size: 1.1em;
    --heading-h5: #73daca;
    --heading-h5-size: 1em;
    --heading-h6: #7aa2f7;
    --heading-h6-size: 0.95em;

    /* ========== SYNTAX HIGHLIGHTING ========== */
    --syntax-header: #e0af68;
    --syntax-bold: #c0caf5;
    --syntax-strong: #c0caf5;
    --syntax-italic: #a9b1d6;
    --syntax-emphasis: #a9b1d6;
    --syntax-strikethrough: #565f89;
    --syntax-link: #7aa2f7;
    --syntax-url: #7aa2f7;
    --syntax-code: #bb9af7;
    --syntax-monospace: #bb9af7;
    --syntax-quote: #565f89;
    --syntax-list: #c0caf5;
    --syntax-separator: #3b4261;

    /* ========== CODE BLOCKS ========== */
    --code-bg: #1f2335;
    --code-text: #c0caf5;
    --code-keyword: #f7768e;
    --code-string: #9ece6a;
    --code-comment: #565f89;
    --code-function: #bb9af7;
    --code-number: #ff9e64;
    --code-operator: #89ddff;
    --code-atom: #73daca;
    --code-bool: #ff9e64;
    --code-regexp: #b4f9f8;
    --code-meta: #565f89;
    --code-punctuation: #a9b1d6;

    /* ========== CODEMIRROR ========== */
    --cm-comment: #565f89;
    --cm-keyword: #f7768e;
    --cm-string: #9ece6a;
    --cm-number: #ff9e64;
    --cm-operator: #89ddff;
    --cm-punctuation: #a9b1d6;
    --cm-function: #bb9af7;
    --cm-property: #7aa2f7;
    --cm-variable: #c0caf5;
    --cm-type: #e0af68;
    --cm-tag: #f7768e;
    --cm-attribute: #7aa2f7;
    --cm-bool: #ff9e64;
    --cm-null: #f7768e;
    --cm-regexp: #b4f9f8;
    --cm-meta: #565f89;
    --cm-heading-marker: #565f89;
    --cm-list-marker: #7aa2f7;
    --cm-quote-marker: #73daca;
    --cm-link-bracket: #565f89;
    --cm-link-text: #7aa2f7;
    --cm-link: #7aa2f7;
    --cm-link-hover: #89b4fa;
    --cm-link-url: #73daca;
    --cm-code-marker: #565f89;
    --cm-emphasis-marker: #565f89;
    --cm-strong-marker: #565f89;

    /* ========== SIZING ========== */
    --code-font-size: 0.9em;
    --code-padding: 2px 6px;
    --code-border-radius: 4px;
    --quote-border-width: 3px;
    --quote-padding-left: 16px;
    --quote-margin-left: 0;
    --font-family-mono: 'JetBrains Mono', 'SF Mono', 'Fira Code', Consolas, monospace;
    --scrollbar-width: 8px;
    --scrollbar-border-radius: 4px;

    /* ========== UI ELEMENTS ========== */
    --button-secondary-bg: #292e42;
    --button-primary-bg: var(--color-primary);
    --button-primary-text: #1a1b26;
    --button-secondary-text: var(--text-primary);
    --tab-bg: transparent;
    --tab-bg-active: var(--bg-primary);
    --tab-border-active: var(--color-primary);
    --input-bg: #292e42;
    --input-border: #3b4261;
    --input-focus-border: var(--color-primary);
    --accent-color: var(--color-primary);
}
```

### light.css

```css
/**
 * My Theme - Light Mode
 */

.theme-light {
    /* ========== BACKGROUND COLORS ========== */
    --bg-primary: #ffffff;
    --bg-secondary: #f5f5f5;
    --bg-sidebar: #fafafa;
    --bg-tertiary: #ebebeb;

    /* ========== TEXT COLORS ========== */
    --text-primary: #343b58;
    --text-secondary: #565a6e;
    --text-muted: #9699a3;

    /* ... continue with all variables ... */
}
```

## Step 4: Add README.md (Optional)

Create a `README.md` file to document your theme:

```markdown
# My Theme

A beautiful custom theme for Inkdown.

## Preview

![Screenshot](screenshot.png)

## Features

- Dark and light modes
- Carefully crafted color palette
- Optimized for long reading sessions

## Installation

1. Download or clone this repository
2. Copy the theme folder to your Inkdown themes directory
3. Restart Inkdown and select "My Theme" in Settings > Themes

## License

MIT
```

## Step 5: Test Your Theme

1. Restart Inkdown (or click "Refresh" in the Themes settings)
2. Open Settings > Themes
3. Your theme should appear in the list
4. Click on it to apply

## Tips for Creating Great Themes

### Color Selection

- **Contrast**: Ensure sufficient contrast between text and background (WCAG AA minimum)
- **Consistency**: Use a cohesive color palette (try tools like [Coolors](https://coolors.co))
- **Meaning**: Use semantic colors (red for danger, green for success)

### Syntax Highlighting

- **Keywords**: Should stand out (typically red/pink/orange)
- **Strings**: Green or cyan work well
- **Comments**: Muted/grayed out
- **Functions**: Purple or blue

### Heading Colors

Consider using a gradient of related colors for headings:

```css
--heading-h1: #ff6b6b;  /* Most prominent */
--heading-h2: #ffa502;
--heading-h3: #ffd43b;
--heading-h4: #69db7c;
--heading-h5: #4dabf7;
--heading-h6: #9775fa;  /* Least prominent */
```

### Testing Checklist

- [ ] Editor looks good with all markdown elements
- [ ] Code blocks are readable
- [ ] Links are visible and distinguishable
- [ ] Selected text is visible
- [ ] Scrollbars blend well
- [ ] Buttons and inputs are usable
- [ ] Both dark and light modes work (if supported)

## Example Themes

Check these themes for inspiration:

- **Gruvbox**: Retro warm colors
- **Minimal**: Clean and distraction-free
- **Tokyo Night**: Modern dark theme with neon accents

## Publishing Your Theme

To share your theme with the community:

1. **Create a GitHub Repository**: Host your theme files
2. **Include Required Files**:
   - `manifest.json` (metadata)
   - `dark.css` and/or `light.css` (theme styles)
   - `README.md` (documentation with screenshots)
   - `screenshot.png` (preview image)
3. **Submit to Registry**: Create a PR to add your theme to [inkdown-community](https://github.com/inkdown/inkdown-community)

### Repository Structure

```
my-theme/
├── manifest.json
├── dark.css
├── light.css
├── README.md
├── screenshot.png
└── LICENSE
```

## Troubleshooting

### Theme not appearing

- Check that `manifest.json` is valid JSON
- Verify the `modes` array matches your CSS files
- Restart Inkdown

### Colors not applying

- Ensure you're using `.theme-dark` or `.theme-light` selectors
- Check for CSS syntax errors
- Verify variable names are correct

### Partial styling

- Some variables might be missing - check the [CSS Architecture](./css-architecture.md) for the full list
- Use browser DevTools to inspect which variables are being used

## Related Documentation

- [CSS Architecture](./css-architecture.md) - Full CSS variables reference
- [Theme System](../architecture/theme-system.md) - How themes work internally
