# Unit Tests

Unit tests for Inkdown core packages using [Vitest](https://vitest.dev/).

## Running Tests

```bash
# From monorepo root
bun run test              # Run all unit tests
bun run test:watch        # Watch mode
bun run test:coverage     # With coverage report

# Run specific test file
bun run test ConfigManager

# Run tests matching pattern
bun run test --grep "Plugin"
```

## Writing Tests

### File Naming

Test files should be named `*.test.ts` and placed alongside or in a `__tests__` folder:

```
packages/core/src/
├── ConfigManager.ts
├── ConfigManager.test.ts    # Option 1: alongside
└── __tests__/
    └── ConfigManager.test.ts # Option 2: in folder
```

### Test Structure

Follow the AAA pattern (Arrange, Act, Assert):

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ConfigManager } from '../ConfigManager';

describe('ConfigManager', () => {
    let configManager: ConfigManager;

    beforeEach(() => {
        // Arrange: Set up fresh instance
        configManager = new ConfigManager();
    });

    describe('loadConfig', () => {
        it('should return null when config does not exist', async () => {
            // Arrange
            vi.mocked(native.config.readConfigFile).mockResolvedValue(null);

            // Act
            const result = await configManager.loadConfig('nonexistent');

            // Assert
            expect(result).toBeNull();
        });

        it('should parse and return valid JSON config', async () => {
            // Arrange
            const mockConfig = { theme: 'dark' };
            vi.mocked(native.config.readConfigFile).mockResolvedValue(JSON.stringify(mockConfig));

            // Act
            const result = await configManager.loadConfig('app');

            // Assert
            expect(result).toEqual(mockConfig);
        });
    });
});
```

### Mocking

Use Vitest's built-in mocking:

```typescript
import { vi, Mock } from 'vitest';

// Mock a module
vi.mock('../native', () => ({
    native: {
        fs: {
            readFile: vi.fn(),
            writeFile: vi.fn(),
        },
        config: {
            readConfigFile: vi.fn(),
            writeConfigFile: vi.fn(),
        }
    }
}));

// Mock a function
const mockCallback = vi.fn();

// Verify calls
expect(mockCallback).toHaveBeenCalled();
expect(mockCallback).toHaveBeenCalledWith('arg1', 'arg2');
expect(mockCallback).toHaveBeenCalledTimes(1);
```

### Testing Async Code

```typescript
it('should handle async operations', async () => {
    const result = await asyncOperation();
    expect(result).toBe(expected);
});

it('should reject with error', async () => {
    await expect(failingOperation()).rejects.toThrow('Expected error');
});
```

## Test Categories

### Core Tests (`core/`)

Tests for `@inkdown/core` package:

| File | Tests |
|------|-------|
| `ConfigManager.test.ts` | Configuration loading, saving, defaults |
| `PluginManager.test.ts` | Plugin lifecycle, enable/disable |
| `ThemeManager.test.ts` | Theme switching, custom themes |
| `CommandManager.test.ts` | Command registration, execution |
| `EditorStateManager.test.ts` | Content caching, dirty state |
| `Workspace.test.ts` | File operations, events |

### Plugin Tests (`plugins/`)

Tests for `@inkdown/plugins` package:

| File | Tests |
|------|-------|
| `WordCountPlugin.test.ts` | Word counting logic |
| `SlashCommands.test.ts` | Command parsing, suggestions |

### Utility Tests (`utils/`)

Tests for utility functions:

| File | Tests |
|------|-------|
| `fuzzy.test.ts` | Fuzzy matching algorithm |
| `path.test.ts` | Path manipulation |
| `markdown.test.ts` | Markdown parsing helpers |

## Coverage

View coverage report after running `bun run test:coverage`:

```bash
open coverage/index.html
```

### Coverage Thresholds

Configured in `vitest.config.ts`:

```typescript
coverage: {
    thresholds: {
        statements: 80,
        branches: 75,
        functions: 80,
        lines: 80,
    }
}
```

## Best Practices

1. **One assertion per test** when possible
2. **Descriptive test names** that explain the scenario
3. **Test behavior, not implementation**
4. **Use factories** for complex test data
5. **Clean up** after tests (handled by `beforeEach`/`afterEach`)
6. **Avoid testing private methods** directly
