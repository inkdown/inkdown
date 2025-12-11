# Smoke Tests

Smoke tests (also known as sanity tests) verify that the most critical functionality of the application works correctly. These are high-level integration tests that ensure the app can start, render, and perform basic operations.

## Structure

```
test/smoke/
├── README.md           # This file
├── setup.ts            # Test setup and utilities
├── app.smoke.test.tsx  # Application startup and initialization
├── editor.smoke.test.tsx   # Editor functionality
├── tabs.smoke.test.tsx     # Tab management
├── files.smoke.test.tsx    # File operations
└── settings.smoke.test.tsx # Settings and themes
```

## Running Smoke Tests

```bash
# Run all smoke tests
bun run test:smoke

# Run with verbose output
bun run test:smoke -- --reporter=verbose

# Run specific smoke test
bun run test:smoke -- app.smoke.test.tsx
```

## What Smoke Tests Cover

### App Initialization (`app.smoke.test.tsx`)
- Application renders without crashing
- Core providers are initialized (App, Theme)
- Essential UI components render (TabBar, StatusBar, etc.)
- Window controls are present

### Editor (`editor.smoke.test.tsx`)
- Editor component mounts
- Can accept and display content
- Basic markdown rendering works
- Editor state updates correctly

### Tab Management (`tabs.smoke.test.tsx`)
- Can create new tabs
- Can switch between tabs
- Can close tabs
- Tab state persists correctly

### File Operations (`files.smoke.test.tsx`)
- File explorer renders
- Can navigate file tree
- File open triggers tab creation
- Save operations work

### Settings (`settings.smoke.test.tsx`)
- Settings modal opens
- Theme switching works
- Settings persist correctly

## Philosophy

Smoke tests should:
1. **Be fast** - They run frequently, so keep them quick
2. **Test critical paths** - Focus on what users do most
3. **Be reliable** - Avoid flaky tests
4. **Fail fast** - If smoke tests fail, there's a major issue

These are not meant to replace unit tests or comprehensive integration tests. They serve as a quick sanity check that the application's core functionality is working.
