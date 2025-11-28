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

## Guidelines

1.  **Use Variables**: Never hardcode colors or dimensions. Use `var(--variable-name)`.
2.  **Mobile First**: Core styles should be responsive or platform-agnostic.
3.  **Component Scoping**: Component-specific styles should be co-located with the component or in a dedicated file in core if shared.
4.  **Theme Compatibility**: Always test styles against both Dark and Light themes.
