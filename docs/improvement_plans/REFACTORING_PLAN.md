# Inkdown Refactoring Plan

**Status:** 🟡 In Progress  
**Branch:** refac  
**Target:** v0.2.0  
**Start Date:** 2026-01-02  

---

## Overview

This document outlines the step-by-step refactoring plan to improve Inkdown's architecture, code quality, and maintainability based on the [Architecture Review](../../ARCHITECTURE_REVIEW.md).

## Goals

1. **Stability:** Fix broken tests and TypeScript compilation
2. **Architecture:** Reduce coupling, improve testability
3. **Quality:** Better error handling, type safety, and code organization
4. **Developer Experience:** Better tooling, CI/CD, and documentation

---

## Phase 1: Foundation & Stability (Week 1-2)

### 1.1 Fix TypeScript Compilation ✅

**Issue:** `tsc: command not found`

**Steps:**
```bash
# Ensure TypeScript is in dependencies
bun add -D typescript@latest

# Update typecheck scripts
# Edit package.json:
"typecheck": "bunx tsc --noEmit -p tsconfig.json",
"typecheck:packages": "bunx tsc -b packages/*/tsconfig.json"

# Test
bun run typecheck
```

**Acceptance Criteria:**
- [ ] `bun run typecheck` runs without errors
- [ ] All packages compile successfully
- [ ] CI runs typecheck on every PR

---

### 1.2 Fix Test Suite ⬜

**Issue:** 74% test failure rate (76 failing tests)

**Root Causes:**
1. IndexedDB mocking issues
2. Missing test cleanup
3. Async timing issues

**Steps:**

**A. Fix IndexedDB Setup**
```typescript
// test/setup.ts
import 'fake-indexeddb/auto';
import { IDBFactory } from 'fake-indexeddb';

// Reset IndexedDB before each test
beforeEach(() => {
    global.indexedDB = new IDBFactory();
});

afterEach(async () => {
    // Close all connections
    const dbs = await indexedDB.databases();
    for (const db of dbs) {
        if (db.name) {
            indexedDB.deleteDatabase(db.name);
        }
    }
});
```

**B. Create Test Utilities**
```typescript
// test/utils/createTestApp.ts
import type { App } from '@inkdown/core';

export async function createTestApp(): Promise<App> {
    const app = new App([]);
    
    // Mock native dependencies
    app.fileSystemManager.setNativeBridge(new MockNativeBridge());
    
    // Initialize with test config
    await app.init();
    
    return app;
}

export async function destroyTestApp(app: App): Promise<void> {
    await app.destroy();
    // Clear all IndexedDB
    const dbs = await indexedDB.databases();
    for (const db of dbs) {
        if (db.name) indexedDB.deleteDatabase(db.name);
    }
}
```

**C. Fix TabManager Tests**
```typescript
// test/unit/core/TabManager.test.ts
import { createTestApp, destroyTestApp } from '../../utils/createTestApp';

describe('TabManager', () => {
    let app: App;
    
    beforeEach(async () => {
        app = await createTestApp();
    });
    
    afterEach(async () => {
        await destroyTestApp(app);
    });
    
    it('should initialize tabs', async () => {
        await app.tabManager.init();
        expect(app.tabManager.getTabs()).toHaveLength(1);
    });
});
```

**Acceptance Criteria:**
- [ ] All TabManager tests pass
- [ ] Test pass rate > 95%
- [ ] Tests run in isolation (no shared state)
- [ ] Test coverage report generated

---

### 1.3 Add Error Boundaries ⬜

**Create Error Boundary Component:**

```typescript
// packages/ui/src/components/ErrorBoundary.tsx
import React, { Component, type ReactNode, type ErrorInfo } from 'react';
import { baseLogger } from '@inkdown/core';

interface Props {
    children: ReactNode;
    fallback?: (error: Error) => ReactNode;
    onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
        baseLogger.error('ErrorBoundary caught error:', error, errorInfo);
        this.props.onError?.(error, errorInfo);
    }

    render(): ReactNode {
        if (this.state.hasError && this.state.error) {
            if (this.props.fallback) {
                return this.props.fallback(this.state.error);
            }
            return <DefaultErrorFallback error={this.state.error} />;
        }

        return this.props.children;
    }
}

function DefaultErrorFallback({ error }: { error: Error }) {
    return (
        <div className="error-boundary">
            <h2>Something went wrong</h2>
            <details>
                <summary>Error details</summary>
                <pre>{error.message}</pre>
                <pre>{error.stack}</pre>
            </details>
            <button onClick={() => window.location.reload()}>
                Reload Application
            </button>
        </div>
    );
}
```

**Apply to App:**

```typescript
// apps/desktop/src/App.tsx
import { ErrorBoundary } from '@inkdown/ui';

export function App() {
    return (
        <ErrorBoundary>
            <AppProvider>
                <MainLayout />
            </AppProvider>
        </ErrorBoundary>
    );
}
```

**Apply to Views:**

```typescript
// apps/desktop/src/components/EditorView.tsx
<ErrorBoundary fallback={(error) => <EditorErrorView error={error} />}>
    <Editor />
</ErrorBoundary>
```

**Acceptance Criteria:**
- [ ] ErrorBoundary component created
- [ ] Applied at app root
- [ ] Applied to major views (editor, settings, file tree)
- [ ] Error logging works
- [ ] UI shows helpful error message

---

### 1.4 Implement Consistent Error Handling ⬜

**Create Error Types:**

```typescript
// packages/core/src/errors/AppError.ts
export enum ErrorCode {
    FILE_NOT_FOUND = 'FILE_NOT_FOUND',
    FILE_READ_ERROR = 'FILE_READ_ERROR',
    FILE_WRITE_ERROR = 'FILE_WRITE_ERROR',
    PLUGIN_LOAD_ERROR = 'PLUGIN_LOAD_ERROR',
    PLUGIN_NOT_FOUND = 'PLUGIN_NOT_FOUND',
    INVALID_CONFIG = 'INVALID_CONFIG',
    NETWORK_ERROR = 'NETWORK_ERROR',
}

export class AppError extends Error {
    constructor(
        public code: ErrorCode,
        message: string,
        public cause?: Error
    ) {
        super(message);
        this.name = 'AppError';
    }
}

export class FileError extends AppError {
    constructor(code: ErrorCode, filePath: string, cause?: Error) {
        super(code, `File operation failed: ${filePath}`, cause);
        this.name = 'FileError';
    }
}

export class PluginError extends AppError {
    constructor(pluginId: string, message: string, cause?: Error) {
        super(ErrorCode.PLUGIN_LOAD_ERROR, `Plugin ${pluginId}: ${message}`, cause);
        this.name = 'PluginError';
    }
}
```

**Create Result Type:**

```typescript
// packages/core/src/types/Result.ts
export type Result<T, E = AppError> =
    | { ok: true; value: T }
    | { ok: false; error: E };

export function Ok<T>(value: T): Result<T, never> {
    return { ok: true, value };
}

export function Err<E>(error: E): Result<never, E> {
    return { ok: false, error };
}

// Helper to unwrap or throw
export function unwrap<T, E>(result: Result<T, E>): T {
    if (result.ok) return result.value;
    throw result.error;
}
```

**Refactor Managers:**

```typescript
// Before
async loadPlugin(id: string): Promise<Plugin | undefined> {
    try {
        // ...
        return plugin;
    } catch (error) {
        console.error('Failed to load plugin:', error);
        return undefined;
    }
}

// After
async loadPlugin(id: string): Promise<Result<Plugin>> {
    try {
        const manifest = await this.getManifest(id);
        const plugin = await this.createPlugin(manifest);
        return Ok(plugin);
    } catch (error) {
        return Err(new PluginError(id, 'Failed to load', error as Error));
    }
}

// Usage
const result = await app.pluginManager.loadPlugin('my-plugin');
if (result.ok) {
    console.log('Loaded:', result.value);
} else {
    app.showError(result.error.message);
}
```

**Acceptance Criteria:**
- [ ] AppError hierarchy created
- [ ] Result type implemented
- [ ] Core managers use Result type
- [ ] Error messages are user-friendly
- [ ] Errors are logged consistently

---

### 1.5 Add Pre-commit Hooks ⬜

**Install Husky:**

```bash
bun add -D husky lint-staged
bunx husky install
```

**Create hooks:**

```bash
# .husky/pre-commit
#!/bin/sh
bun run lint-staged
```

**Configure lint-staged:**

```javascript
// lint-staged.config.js
export default {
    '*.{ts,tsx}': [
        'biome check --write --no-errors-on-unmatched',
        'vitest related --run --passWithNoTests'
    ],
    '*.{css,json,md}': [
        'biome format --write --no-errors-on-unmatched'
    ]
};
```

**Update package.json:**

```json
{
    "scripts": {
        "prepare": "husky install"
    }
}
```

**Acceptance Criteria:**
- [ ] Husky installed and configured
- [ ] Pre-commit hook runs lint and tests
- [ ] Commits are blocked if checks fail
- [ ] Documentation updated

---

### 1.6 Set Up CI/CD Pipeline ⬜

**Create GitHub Actions workflow:**

```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [main, refac]
  pull_request:
    branches: [main]

jobs:
  lint-and-typecheck:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v1
      
      - name: Install dependencies
        run: bun install
      
      - name: Run linter
        run: bun run lint
      
      - name: Run type checking
        run: bun run typecheck

  test:
    runs-on: ${{ matrix.os }}
    strategy:
      matrix:
        os: [ubuntu-latest, macos-latest, windows-latest]
    
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v1
      
      - name: Install dependencies
        run: bun install
      
      - name: Run unit tests
        run: bun test:unit
      
      - name: Run smoke tests
        run: bun test:smoke
      
      - name: Upload coverage
        if: matrix.os == 'ubuntu-latest'
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/coverage-final.json

  build:
    needs: [lint-and-typecheck, test]
    runs-on: ${{ matrix.os }}
    strategy:
      matrix:
        os: [ubuntu-latest, macos-latest, windows-latest]
    
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v1
      - uses: actions-rs/toolchain@v1
        with:
          toolchain: stable
      
      - name: Install dependencies
        run: bun install
      
      - name: Build desktop app
        run: bun run build
      
      - name: Upload artifacts
        uses: actions/upload-artifact@v3
        with:
          name: inkdown-${{ matrix.os }}
          path: apps/desktop/src-tauri/target/release/bundle/
```

**Acceptance Criteria:**
- [ ] CI workflow created
- [ ] Runs on push to main and refac
- [ ] Runs on pull requests
- [ ] Tests run on Linux, macOS, Windows
- [ ] Artifacts uploaded for each OS
- [ ] Badge added to README.md

---

## Phase 2: Architecture Improvements (Week 3-4)

### 2.1 Implement Event Bus System ⬜

**Create EventBus:**

```typescript
// packages/core/src/EventBus.ts
export type EventMap = {
    // File events
    'file:created': { path: string };
    'file:opened': { path: string; content: string };
    'file:saved': { path: string };
    'file:deleted': { path: string };
    'file:renamed': { oldPath: string; newPath: string };
    
    // Editor events
    'editor:content-changed': { path: string; content: string };
    'editor:selection-changed': { from: number; to: number };
    
    // Tab events
    'tab:opened': { tabId: string; filePath?: string };
    'tab:closed': { tabId: string };
    'tab:switched': { tabId: string };
    
    // Theme events
    'theme:changed': { theme: string };
    'theme:color-scheme-changed': { colorScheme: 'light' | 'dark' };
    
    // Plugin events
    'plugin:loaded': { pluginId: string };
    'plugin:unloaded': { pluginId: string };
    'plugin:enabled': { pluginId: string };
    'plugin:disabled': { pluginId: string };
};

type EventHandler<K extends keyof EventMap> = (data: EventMap[K]) => void;

export class EventBus {
    private listeners = new Map<keyof EventMap, Set<Function>>();
    
    on<K extends keyof EventMap>(
        event: K,
        handler: EventHandler<K>
    ): () => void {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, new Set());
        }
        this.listeners.get(event)!.add(handler);
        
        // Return unsubscribe function
        return () => {
            const handlers = this.listeners.get(event);
            if (handlers) {
                handlers.delete(handler);
            }
        };
    }
    
    emit<K extends keyof EventMap>(event: K, data: EventMap[K]): void {
        const handlers = this.listeners.get(event);
        if (handlers) {
            for (const handler of handlers) {
                try {
                    handler(data);
                } catch (error) {
                    console.error(`Error in event handler for ${event}:`, error);
                }
            }
        }
    }
    
    off<K extends keyof EventMap>(event: K, handler: EventHandler<K>): void {
        const handlers = this.listeners.get(event);
        if (handlers) {
            handlers.delete(handler);
        }
    }
    
    clear(): void {
        this.listeners.clear();
    }
}
```

**Add to App:**

```typescript
// packages/core/src/App.ts
export class App {
    events: EventBus;
    
    constructor() {
        this.events = new EventBus();
        // ...
    }
}
```

**Use in Managers:**

```typescript
// packages/core/src/managers/Workspace.ts
async create(path: string, content: string): Promise<void> {
    await this.fileSystem.write(path, content);
    this.app.events.emit('file:created', { path });
}
```

**Use in Plugins:**

```typescript
// Plugin example
export class MyPlugin extends Plugin {
    async onload() {
        this.registerEvent(
            this.app.events.on('file:opened', (data) => {
                console.log('File opened:', data.path);
            })
        );
    }
}
```

**Acceptance Criteria:**
- [ ] EventBus class created
- [ ] All events documented
- [ ] App has events instance
- [ ] Managers emit events
- [ ] Plugins can subscribe to events
- [ ] Documentation updated

---

### 2.2 Refactor Managers with Dependency Injection ⬜

**Define Service Interfaces:**

```typescript
// packages/core/src/types/services.ts
export interface FileSystemService {
    read(path: string): Promise<string>;
    write(path: string, content: string): Promise<void>;
    delete(path: string): Promise<void>;
    list(directory: string): Promise<string[]>;
}

export interface EventService {
    on<K extends keyof EventMap>(event: K, handler: EventHandler<K>): () => void;
    emit<K extends keyof EventMap>(event: K, data: EventMap[K]): void;
}

export interface LoggerService {
    info(message: string, ...args: unknown[]): void;
    error(message: string, ...args: unknown[]): void;
    warn(message: string, ...args: unknown[]): void;
    debug(message: string, ...args: unknown[]): void;
}
```

**Refactor Workspace:**

```typescript
// Before
export class Workspace {
    constructor(private app: App) {}
    
    async create(path: string, content: string) {
        await this.app.fileSystemManager.write(path, content);
        this.app.metadataCache.update(path);
    }
}

// After
interface WorkspaceDependencies {
    fileSystem: FileSystemService;
    metadataCache: MetadataCache;
    events: EventService;
    logger: LoggerService;
}

export class Workspace {
    constructor(private deps: WorkspaceDependencies) {}
    
    async create(path: string, content: string): Promise<void> {
        await this.deps.fileSystem.write(path, content);
        this.deps.metadataCache.update(path);
        this.deps.events.emit('file:created', { path });
        this.deps.logger.info('File created:', path);
    }
}
```

**Update App Constructor:**

```typescript
export class App {
    constructor() {
        // Create primitive services first
        this.events = new EventBus();
        this.fileSystemManager = new FileSystemManager();
        this.logger = createLogger('App');
        
        // Create managers with dependencies
        this.workspace = new Workspace({
            fileSystem: this.fileSystemManager,
            metadataCache: this.metadataCache,
            events: this.events,
            logger: createLogger('Workspace')
        });
    }
}
```

**Acceptance Criteria:**
- [ ] Service interfaces defined
- [ ] Workspace refactored with DI
- [ ] PluginManager refactored with DI
- [ ] TabManager refactored with DI
- [ ] Unit tests updated (easier mocking)
- [ ] Documentation updated

---

### 2.3 Extract Service Layer ⬜

**Create Services:**

```typescript
// packages/core/src/services/PluginLoaderService.ts
export class PluginLoaderService {
    async load(manifest: PluginManifest): Promise<Plugin> {
        // Pure loading logic - no dependencies on App
        const module = await import(manifest.main);
        const PluginClass = module.default;
        return new PluginClass(manifest);
    }
}

// packages/core/src/services/PluginValidationService.ts
export class PluginValidationService {
    validate(manifest: PluginManifest): Result<void> {
        if (!manifest.id) {
            return Err(new AppError(ErrorCode.INVALID_CONFIG, 'Missing plugin ID'));
        }
        if (!manifest.version) {
            return Err(new AppError(ErrorCode.INVALID_CONFIG, 'Missing plugin version'));
        }
        return Ok(undefined);
    }
}

// packages/core/src/services/FileValidationService.ts
export class FileValidationService {
    isMarkdown(path: string): boolean {
        return path.endsWith('.md') || path.endsWith('.markdown');
    }
    
    sanitizePath(path: string): string {
        // Remove dangerous characters
        return path.replace(/[<>:"|?*]/g, '');
    }
}
```

**Update Managers:**

```typescript
export class PluginManager {
    constructor(
        private loader: PluginLoaderService,
        private validator: PluginValidationService,
        private storage: StorageService,
        private events: EventService
    ) {}
    
    async loadPlugin(id: string): Promise<Result<Plugin>> {
        const manifest = await this.storage.getManifest(id);
        
        const validation = this.validator.validate(manifest);
        if (!validation.ok) return validation;
        
        const plugin = await this.loader.load(manifest);
        this.events.emit('plugin:loaded', { pluginId: id });
        
        return Ok(plugin);
    }
}
```

**Acceptance Criteria:**
- [ ] Services created and documented
- [ ] Services are pure (no App dependency)
- [ ] Services are unit tested (100% coverage)
- [ ] Managers use services
- [ ] Documentation updated

---

## Phase 3: Code Quality (Week 5-6)

### 3.1 Enable Strict TypeScript Rules ⬜

**Update tsconfig.base.json:**

```json
{
    "compilerOptions": {
        "strict": true,
        "strictNullChecks": true,
        "strictFunctionTypes": true,
        "strictBindCallApply": true,
        "strictPropertyInitialization": true,
        "noImplicitThis": true,
        "noUncheckedIndexedAccess": true,
        "noImplicitReturns": true,
        "noFallthroughCasesInSwitch": true,
        "noUnusedLocals": true,
        "noUnusedParameters": true,
        "allowUnusedLabels": false,
        "allowUnreachableCode": false
    }
}
```

**Fix compilation errors incrementally:**
1. Run `bun run typecheck`
2. Fix errors in core package first
3. Then ui, then plugins, then desktop

**Acceptance Criteria:**
- [ ] Strict mode enabled
- [ ] All packages compile without errors
- [ ] CI enforces strict mode

---

### 3.2 Replace `any` with Proper Types ⬜

**Audit:**
```bash
# Find all `any` usages
grep -r ": any" packages/core/src --include="*.ts" --include="*.tsx"
```

**Replace:**
```typescript
// Before
private editorSuggests: any[] = [];

// After
private editorSuggests: EditorSuggest<unknown>[] = [];

// Before
registerMarkdownCodeBlockProcessor(
    language: string,
    processor: any
): void

// After
registerMarkdownCodeBlockProcessor(
    language: string,
    processor: MarkdownCodeBlockProcessor
): void
```

**Acceptance Criteria:**
- [ ] Zero `any` in packages/core/src
- [ ] Less than 5 `any` in entire codebase
- [ ] All `any` are documented why needed

---

### 3.3 Organize Code by Features ⬜

**Reorganize packages/core/src:**

```
packages/core/src/
├── features/
│   ├── tabs/
│   │   ├── TabManager.ts
│   │   ├── TabService.ts
│   │   ├── TabRepository.ts
│   │   ├── types.ts
│   │   └── __tests__/
│   │       └── TabManager.test.ts
│   ├── plugins/
│   │   ├── PluginManager.ts
│   │   ├── PluginLoaderService.ts
│   │   ├── PluginValidationService.ts
│   │   ├── CommunityPluginManager.ts
│   │   ├── types.ts
│   │   └── __tests__/
│   ├── workspace/
│   │   ├── Workspace.ts
│   │   ├── WorkspaceUI.ts
│   │   ├── FileManager.ts
│   │   ├── types.ts
│   │   └── __tests__/
│   └── themes/
│       ├── ThemeManager.ts
│       ├── CommunityThemeManager.ts
│       ├── types.ts
│       └── __tests__/
├── shared/
│   ├── types/
│   ├── utils/
│   ├── services/
│   └── components/
├── App.ts
└── index.ts
```

**Migration steps:**
1. Create new feature directories
2. Move related files
3. Update imports
4. Update exports in index.ts
5. Run tests

**Acceptance Criteria:**
- [ ] Code organized by features
- [ ] Tests colocated with features
- [ ] All imports updated
- [ ] Documentation updated

---

## Checklist Summary

### Phase 1: Foundation (Week 1-2)
- [ ] Fix TypeScript compilation
- [ ] Fix test suite (>95% pass rate)
- [ ] Add error boundaries
- [ ] Implement consistent error handling
- [ ] Add pre-commit hooks
- [ ] Set up CI/CD pipeline

### Phase 2: Architecture (Week 3-4)
- [ ] Implement EventBus system
- [ ] Refactor managers with DI
- [ ] Extract service layer

### Phase 3: Code Quality (Week 5-6)
- [ ] Enable strict TypeScript
- [ ] Replace `any` types
- [ ] Organize code by features

---

## Success Metrics

| Metric | Before | Target |
|--------|--------|--------|
| Test Pass Rate | 26% | >95% |
| TypeScript Errors | N/A (broken) | 0 |
| Code Coverage | Unknown | >80% |
| Build Time | Unknown | <2 min |
| CI/CD | None | ✅ |

---

## Next Steps

1. Review this plan with team
2. Create GitHub issues for each task
3. Start Phase 1
4. Update this document as work progresses

---

**Last Updated:** 2026-01-02  
**Status:** Ready to begin
