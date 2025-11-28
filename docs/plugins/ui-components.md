# UI Components & Styling

Inkdown provides a shared UI package (`@inkdown/ui`) and a comprehensive CSS variable system to ensure consistency and ease of development for plugins.

## UI Package (`@inkdown/ui`)

The UI package contains reusable React components. Plugins can import these components to build consistent interfaces.

### Key Components

*   **Button**: Standard buttons with variants (primary, secondary, danger).
*   **Input**: Text inputs, checkboxes, etc.
*   **Modal**: Base component for creating modal dialogs.
*   **Notice**: Toast notifications.
*   **Setting**: Components for building settings pages (SettingItem, SettingName, SettingDesc, etc.).

### Usage in Plugins

```typescript
import { Button, Setting } from '@inkdown/ui';

// In a React component or SettingTab
<Setting>
    <Setting.Name>Enable Feature</Setting.Name>
    <Setting.Control>
        <Button onClick={handleClick}>Click Me</Button>
    </Setting.Control>
</Setting>
```

## CSS Architecture

Inkdown uses a centralized CSS architecture based on CSS variables. This allows for easy theming and consistent styling across the app and plugins.

### Core Styles (`@inkdown/core/styles`)

The core styles are divided into modules:

*   **variables.css**: Defines global CSS variables (colors, spacing, typography).
*   **base.css**: CSS reset and base element styles.
*   **icons.css**: Icon system styles.
*   **plugin-api.css**: Styles for plugin UI components (Modals, Settings, Notices).
*   **popover-suggest.css**: Styles for suggestion popovers.

### CSS Variables

Plugins should **always** use CSS variables instead of hardcoded values. This ensures compatibility with themes (Dark/Light modes).

**Common Variables:**

| Variable | Description |
| :--- | :--- |
| `--color-primary` | Main accent color |
| `--bg-primary` | Main background color |
| `--bg-secondary` | Secondary background (sidebar, panels) |
| `--text-primary` | Main text color |
| `--text-muted` | Muted/secondary text color |
| `--border-color` | Standard border color |
| `--radius-sm/md/lg` | Border radius tokens |
| `--spacing-sm/md/lg` | Spacing tokens |

### Theming

Themes are simply CSS files that override these variables. They are located in `@inkdown/core/styles/themes/`.

To create a new theme, simply create a CSS file that targets `.theme-dark` or `.theme-light` and overrides the variables.

```css
.theme-dark {
    --bg-primary: #000000;
    --text-primary: #ffffff;
    --color-primary: #ff0000;
}
```
