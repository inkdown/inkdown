# Testing Strategy & Improvements

Inspired by [VS Code's Testing Policy](https://github.com/microsoft/vscode/wiki/Testing-Policy), this document outlines the testing strategy for Inkdown.

## 1. Unit Tests
**Tool:** `vitest`
**Scope:** Core logic, utility functions, pure components.
**Goal:** High coverage for `@inkdown/core` and critical utilities.
**Plan:**
- Migrate any remaining `jest` tests to `vitest`.
- Enforce coverage thresholds for new PRs.
- Test `CommandManager`, `KeybindingManager`, `FileSystemManager` extensively.

## 2. Integration Tests
**Tool:** `playwright` or `webdriverio` (with Tauri driver)
**Scope:** End-to-end flows in the Desktop app.
**Goal:** Verify critical user journeys (Open app, create note, save, sync).
**Plan:**
- Setup Playwright for Electron/Tauri (Tauri supports WebDriver).
- Automate "Smoke Test" suite:
  - App launch
  - File creation/deletion
  - Editor typing
  - Plugin loading

## 3. Manual Testing (Self-hosting)
**Philosophy:** "Eating our own dog food".
**Plan:**
- Developers use Inkdown to write Inkdown documentation.
- Weekly "Insiders" build for internal usage before release.

## 4. Performance Testing
**Tool:** Custom benchmarks / Chrome Tracing
**Scope:** Editor startup time, large file handling.
**Plan:**
- Measure `app.init()` time.
- Measure typing latency in large markdown files (50k lines).
