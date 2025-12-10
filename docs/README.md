# Inkdown Documentation

Welcome to the Inkdown developer documentation. Here you will find everything you need to understand the architecture, build plugins and themes, and contribute to the project.

## Architecture

Technical documentation about Inkdown's internal architecture.

| Document | Description |
|----------|-------------|
| [**Overview**](./architecture/README.md) | High-level architecture, managers, data flow |
| [**Editor**](./architecture/editor.md) | CodeMirror 6 editor implementation |
| [**Theme System**](./architecture/theme-system.md) | Theme management, ThemeManager, CommunityThemeManager |
| [**Configuration System**](./architecture/config-system.md) | ConfigManager and settings storage |

## Plugin Development

Everything you need to build plugins for Inkdown.

| Document | Description |
|----------|-------------|
| [**Plugin System**](./plugins/system.md) | Plugin API, lifecycle, and capabilities |
| [**Community Plugins**](./plugins/community-plugins.md) | Creating, publishing, and installing plugins |
| [**UI Components**](./plugins/ui-components.md) | Modal, Setting, Notice, EditorSuggest, and more |
| [**Built-in Plugins**](./built-in-plugins.md) | Word Count, Quick Finder, Slash Commands, Live Preview |

## Styling & Theming

| Document | Description |
|----------|-------------|
| [**CSS Architecture**](./styling/css-architecture.md) | CSS variables reference, structure, best practices |
| [**Creating Themes**](./styling/creating-themes.md) | Step-by-step theme creation guide |

## Contributing

| Document | Description |
|----------|-------------|
| [**Contributing Guide**](../CONTRIBUTING.md) | How to contribute to Inkdown |
| [**Development Guide**](./contributing/development-guide.md) | Setup, commands, and workflow |

---

## Quick Start

### For Plugin Developers

1. Read the [Architecture Overview](./architecture/README.md) to understand the system
2. Study the [Plugin System](./plugins/system.md) to learn the API
3. Look at [Built-in Plugins](./built-in-plugins.md) for real examples
4. Use the [UI Components](./plugins/ui-components.md) for consistent UI

### For Theme Creators

1. Read [CSS Architecture](./styling/css-architecture.md) for the variables reference
2. Follow [Creating Themes](./styling/creating-themes.md) to build your theme
3. Check [Theme System](./architecture/theme-system.md) to understand how themes work

### For Contributors

1. Read the [Contributing Guide](../CONTRIBUTING.md)
2. Set up your dev environment with the [Development Guide](./contributing/development-guide.md)
3. Pick an issue and start coding!

---

## 📦 Package Structure

```
inkdown/
├── apps/
│   └── desktop/          # Tauri desktop app
├── packages/
│   ├── core/             # @inkdown/core - Business logic, Plugin API
│   ├── ui/               # @inkdown/ui - React components
│   ├── plugins/          # @inkdown/plugins - Built-in plugins
│   └── native-tauri/     # @inkdown/native-tauri - Tauri bindings
└── docs/                 # This documentation
```

---

*Documentation for Inkdown v0.1.0*