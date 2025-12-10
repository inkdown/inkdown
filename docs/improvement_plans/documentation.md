# Documentation Strategy

## 1. User Documentation
**Goal:** Easy to understand guides for end-users.
**Plan:**
- Create a `docs/user` folder.
- Guides:
  - "Getting Started"
  - "Syncing your notes"
  - "Using Plugins"
  - "Keyboard Shortcuts Cheat Sheet"

## 2. Developer Documentation
**Goal:** Enable community contributions.
**Plan:**
- `CONTRIBUTING.md`: refined with "How to" for plugins.
- `ARCHITECTURE.md`: High-level diagram (the one we worked on).
- `API.md`: Generated from TSDoc for `@inkdown/core`.

## 3. API Reference
- Use `typedoc` to generate HTML documentation for plugin developers.
- Host on GitHub Pages.
