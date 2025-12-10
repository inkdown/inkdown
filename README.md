# Inkdown

<!-- <p align="center">
  <img src="apps/desktop/src-tauri/icons/icon.png" alt="Inkdown Logo" width="128" height="128">
</p> -->

<p align="center">
  <strong>A modern, fast, privacy-focused markdown editor for your notes</strong>
</p>

<p align="center">
  <a href="#features">Features</a> •
  <a href="#installation">Installation</a> •
  <a href="#development">Development</a> •
  <a href="#documentation">Documentation</a> •
  <a href="#contributing">Contributing</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/platform-macOS%20%7C%20Windows%20%7C%20Linux-blue" alt="Platform">
  <img src="https://img.shields.io/badge/license-MIT-green" alt="License">
</p>

---

## Features

-  **Markdown Editor** - Full-featured editor powered by CodeMirror 6
-  **Live Preview** - See your formatting as you type
-  **Local-first** - Your notes stay on your computer
-  **Themes** - Dark, light, and custom themes
-  **Plugins** - Extend functionality with plugins
-  **Keyboard-centric** - Vim mode, customizable shortcuts
-  **Sync** - Optional end-to-end encrypted sync (coming soon)

## Installation

### Download

Download the latest release for your platform from the [Releases](https://github.com/inkdown/inkdown/releases) page.

| Platform | Download |
|----------|----------|
| macOS (Apple Silicon) | `.dmg` |
| macOS (Intel) | `.dmg` |
| Windows | `.msi` |
| Linux | `.AppImage` |

### Build from Source

See [Development](#development) section below.

## Development

### Prerequisites

- [Node.js](https://nodejs.org/) v18+
- [Bun](https://bun.sh/) v1.0+
- [Rust](https://www.rust-lang.org/tools/install)

### Recommended IDE Setup

- [VS Code](https://code.visualstudio.com/)
- [Tauri Extension](https://marketplace.visualstudio.com/items?itemName=tauri-apps.tauri-vscode)
- [rust-analyzer](https://marketplace.visualstudio.com/items?itemName=rust-lang.rust-analyzer)

### Setup

```bash
# Clone the repository
git clone https://github.com/inkdown/inkdown.git
cd inkdown

# Install dependencies
bun install

# Start development server
bun tauri dev
```

### Commands

| Command | Description |
|---------|-------------|
| `bun run dev` | Start development server |
| `bun run build` | Build for production |
| `bun run typecheck` | TypeScript type checking |
| `bun run lint` | Run linter |
| `bun run check` | Run all checks |

### Project Structure

```
inkdown/
├── apps/desktop/        # Tauri desktop app
├── packages/
│   ├── core/            # Core business logic
│   ├── ui/              # Shared UI components
│   ├── plugins/         # Built-in plugins
│   └── native-tauri/    # Tauri platform bridge
└── docs/                # Documentation
```

## Documentation

- **Users**: [Getting Started](docs/user/getting-started.md) | [Keyboard Shortcuts](docs/user/keyboard-shortcuts.md)
- **Developers**: [Architecture](docs/architecture/README.md) | [Plugin System](docs/plugins/system.md)
- **Contributors**: [Contributing Guide](CONTRIBUTING.md) | [Development Guide](docs/contributing/development-guide.md)

## Contributing

We welcome contributions! Please read our [Contributing Guide](CONTRIBUTING.md) to get started.

### Quick Start

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Make your changes
4. Run checks: `bun run check`
5. Submit a Pull Request

## Tech Stack

- **Framework**: [Tauri](https://tauri.app/) (Rust + Web)
- **Frontend**: [React](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- **Editor**: [CodeMirror 6](https://codemirror.net/)
- **Styling**: CSS Variables
- **Build**: [Vite](https://vitejs.dev/) + [Bun](https://bun.sh/)

## License

MIT License - see [LICENSE](LICENSE) for details.

---

<p align="center">
  Made with ❤️ by <a href="https://github.com/l-furquim">Lucas</a>
</p>
