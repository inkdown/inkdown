# Inkdown Tests

This folder contains the testing infrastructure for Inkdown, inspired by [VS Code's testing strategy](https://github.com/microsoft/vscode/wiki/Testing-Policy).

## Test Types

| Type | Tool | Scope | Location |
|------|------|-------|----------|
| **Unit Tests** | Vitest | Core logic, utilities, pure functions | `test/unit/` |
| **Integration Tests** | Playwright + Tauri | API and component integration | `test/integration/` |
| **Smoke Tests** | Playwright | End-to-end user journeys | `test/smoke/` |

## Quick Start

```bash
# Run all unit tests
bun run test

# Run unit tests in watch mode
bun run test:watch

# Run unit tests with coverage
bun run test:coverage

# Run integration tests
bun run test:integration

# Run smoke tests (requires built app)
bun run test:smoke
```

## Directory Structure

```
test/
├── README.md                 # This file
├── unit/                     # Unit tests
│   ├── README.md
│   ├── setup.ts              # Test setup and mocks
│   ├── core/                 # @inkdown/core tests
│   │   ├── ConfigManager.test.ts
│   │   ├── PluginManager.test.ts
│   │   ├── ThemeManager.test.ts
│   │   └── ...
│   ├── plugins/              # @inkdown/plugins tests
│   └── utils/                # Utility function tests
├── integration/              # Integration tests
│   ├── README.md
│   └── ...
├── smoke/                    # End-to-end smoke tests
│   ├── README.md
│   ├── src/
│   │   ├── main.ts           # Test runner entry
│   │   ├── utils.ts          # Test utilities
│   │   └── areas/            # Test areas
│   │       ├── editor/
│   │       ├── sidebar/
│   │       └── plugins/
│   └── package.json
└── automation/               # Test automation library
    ├── src/
    │   ├── index.ts
    │   ├── application.ts    # App control
    │   ├── workbench.ts      # Workbench page objects
    │   ├── editor.ts         # Editor interactions
    │   └── ...
    └── package.json
```

## Philosophy

### 1. Test Pyramid

```
        ╱╲
       ╱  ╲      Smoke Tests (few, slow, high confidence)
      ╱────╲
     ╱      ╲    Integration Tests (medium)
    ╱────────╲
   ╱          ╲  Unit Tests (many, fast, isolated)
  ╱────────────╲
```

- **Unit Tests**: Fast, isolated, high coverage for core logic
- **Integration Tests**: Verify component interactions
- **Smoke Tests**: Critical user journeys only

### 2. Self-Hosting ("Dogfooding")

Developers use Inkdown to write Inkdown documentation and notes. This provides continuous real-world testing.

### 3. Test Characteristics

Good tests are:
- **Fast**: Unit tests should complete in milliseconds
- **Isolated**: No dependencies between tests
- **Deterministic**: Same result every time
- **Clear**: Easy to understand what failed and why

## Coverage Goals

| Package | Target Coverage |
|---------|-----------------|
| `@inkdown/core` | 80%+ |
| `@inkdown/plugins` | 70%+ |
| `@inkdown/ui` | 60%+ |

## Related Documentation

- [Testing Strategy](../docs/improvement_plans/testing.md)
- [Contributing Guide](../CONTRIBUTING.md)
