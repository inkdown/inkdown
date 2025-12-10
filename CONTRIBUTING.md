# Contributing to Inkdown

Thank you for your interest in contributing to Inkdown!

This document will guide you through the contribution process.

## Table of Contents

- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Making Changes](#making-changes)
- [Submitting a Pull Request](#submitting-a-pull-request)
- [Coding Guidelines](#coding-guidelines)
- [Commit Convention](#commit-convention)

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or later)
- [Bun](https://bun.sh/) (v1.0 or later)
- [Rust](https://www.rust-lang.org/tools/install) (for Tauri)
- [Git](https://git-scm.com/)

### Fork and Clone

1. Fork the repository on GitHub
2. Clone your fork locally:

```bash
git clone https://github.com/YOUR_USERNAME/inkdown.git
cd inkdown
```

3. Add the upstream remote:

```bash
git remote add upstream https://github.com/inkdown/inkdown.git
```

---

## Development Setup

### Install Dependencies

```bash
bun install
```

### Run Development Server

```bash
bun tauri dev
```

This starts the Tauri development server with hot reload.

### Project Structure

```
inkdown/
├── apps/
│   └── desktop/          # Tauri desktop application
├── packages/
│   ├── core/             # Core logic
│   ├── ui/               # Shared UI components
│   ├── plugins/          # Built-in plugins
│   └── native-tauri/     # Tauri-specific adapters
├── docs/                 # Documentation
└── package.json          # Root package.json
```

### Useful Commands

| Command | Description |
|---------|-------------|
| `bun run dev` | Start development server |
| `bun run build` | Build for production |
| `bun run typecheck` | Run TypeScript type checking |
| `bun run lint` | Run linter (Biome) |
| `bun run lint:fix` | Fix linting issues |
| `bun run format` | Format code |
| `bun run check` | Run all checks (lint + typecheck) |

---

## Making Changes

### Create a Branch

```bash
git checkout -b feature/your-feature-name
# or
git checkout -b fix/your-bug-fix
```

### Branch Naming Convention

- `feature/` - New features
- `fix/` - Bug fixes
- `docs/` - Documentation changes
- `refactor/` - Code refactoring
- `test/` - Adding or updating tests

### Keep Your Branch Updated

```bash
git fetch upstream
git rebase upstream/main
```

### Run Checks Before Committing

Always run these before committing:

```bash
bun run check        # Lint and typecheck
bun run typecheck    # TypeScript only
```

---

## Submitting a Pull Request

### Before Submitting

- [ ] Code follows the [coding guidelines](#coding-guidelines)
- [ ] All checks pass (`bun run check`)
- [ ] Tests added for new functionality (when applicable)
- [ ] Documentation updated (if needed)
- [ ] Commits follow the [commit convention](#commit-convention)

### Creating the PR

1. Push your branch to your fork:

```bash
git push origin feature/your-feature-name
```

2. Go to GitHub and create a Pull Request

3. Fill out the PR template with:
   - Description of changes
   - Related issues
   - Screenshots (for UI changes)

### PR Review Process

1. A maintainer will review your PR
2. Address any requested changes
3. Once approved, your PR will be merged

---

## Coding Guidelines

### TypeScript

- Use strict TypeScript (`strict: true`)
- Avoid `any` type - use `unknown` if necessary
- Export types from their defining module
- Use interfaces for objects, types for unions/primitives

### Styling

- Use **CSS files** for component styles (not inline styles)
- Always use **CSS variables** for colors (never hardcoded hex values)
- Keep styles close to their components
- Use semantic variable names

```css
/* Good */
.button {
    background: var(--color-primary);
    color: var(--text-primary);
}

/* Bad */
.button {
    background: #6c99bb;
    color: #dcdcdc;
}
```

### File Organization

- One component per file
- Use feature-based folder organization
- Keep related files together

### Imports

- Use absolute imports for packages: `@inkdown/core`
- Use relative imports within a package: `./utils`
- Order: external packages, then internal packages, then relative

### Comments

- Write self-documenting code
- Add comments for complex logic
- Use JSDoc for public APIs

---

## Commit Convention

We use [Conventional Commits](https://www.conventionalcommits.org/).

### Format

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

### Types

| Type | Description |
|------|-------------|
| `feat` | New feature |
| `fix` | Bug fix |
| `docs` | Documentation |
| `style` | Code style (formatting, etc.) |
| `refactor` | Code change that neither fixes a bug nor adds a feature |
| `perf` | Performance improvement |
| `test` | Adding or updating tests |
| `chore` | Maintenance tasks |

### Examples

```
feat(editor): add vim mode support

fix(sync): resolve conflict detection issue

docs(readme): update installation instructions

refactor(core): simplify plugin loading logic
```

---

## Types of Contributions

### Bug Reports

Found a bug? [Open an issue](https://github.com/inkdown/inkdown/issues/new?template=bug_report.md) with:

- Clear description
- Steps to reproduce
- Expected vs actual behavior
- Screenshots if applicable
- System information

### Feature Requests

Have an idea? [Open a discussion](https://github.com/inkdown/inkdown/discussions/new?category=ideas) first to get feedback before implementing.

### Documentation

Documentation improvements are always welcome:

- Fix typos
- Add examples
- Improve clarity
- Translate (future)

### Plugins

Want to create a plugin? Check out our [Plugin Development Guide](docs/plugins/system.md).

---

## Getting Help

- **Questions**: [GitHub Discussions](https://github.com/inkdown/inkdown/discussions)
- **Bugs**: [GitHub Issues](https://github.com/inkdown/inkdown/issues)
- **Chat**: Coming soon!

---

## Recognition

Contributors are recognized in:

- `CONTRIBUTORS.md` file
- Release notes
- Our eternal gratitude 💜

Thank you for contributing to Inkdown!
