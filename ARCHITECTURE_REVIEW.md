# Inkdown Architecture Review & Improvement Recommendations

**Date:** January 2, 2026  
**Branch:** refac  
**Reviewer:** Senior Code Reviewer  

## Executive Summary

Inkdown is a well-structured markdown editor built with modern technologies (Tauri v2, React 19, TypeScript). The codebase demonstrates good architectural patterns with clear separation of concerns through a monorepo structure. However, there are several opportunities for improvement in architecture, code quality, testing, and project management.

**Overall Assessment:** 🟡 Good foundation with room for systematic improvements

---

## Table of Contents

1. [Project Structure Analysis](#1-project-structure-analysis)
2. [Architecture Strengths](#2-architecture-strengths)
3. [Critical Issues](#3-critical-issues)
4. [Important Issues](#4-important-issues)
5. [Architecture Improvements](#5-architecture-improvements)
6. [Code Quality Improvements](#6-code-quality-improvements)
7. [Testing Strategy](#7-testing-strategy)
8. [Project Management](#8-project-management)
9. [Implementation Roadmap](#9-implementation-roadmap)

---

## 1. Project Structure Analysis

### Current Structure
```
inkdown/
├── apps/desktop/          # Tauri desktop app (1 app)
├── packages/
│   ├── core/             # Business logic, Plugin API (206 TS files total)
│   ├── ui/               # React components
│   ├── plugins/          # Built-in plugins
│   ├── plugin-api/       # Public plugin API definitions
│   └── native-tauri/     # Tauri platform bridge
├── docs/                 # 3,187 lines of documentation
└── test/                 # Unit + smoke tests (27 pass, 76 fail)
```

### Package Dependencies
```
desktop → core + ui + plugins + native-tauri
plugins → core + ui
ui → core
core → native (interface-based)
native-tauri → implements core/native interfaces
```

**✅ Strength:** Clean dependency graph with no circular dependencies.

---

## 2. Architecture Strengths

### 2.1 Well-Defined Separation of Concerns

**✅ Excellent:** The monorepo clearly separates layers:
- **Apps**: Platform-specific entry points
- **Core**: Platform-agnostic business logic
- **UI**: Reusable components
- **Native**: Platform adapters (Tauri)
- **Plugins**: Feature modules

### 2.2 Manager Pattern Implementation

**✅ Good:** The `App` class acts as a central coordinator with specialized managers:
- ConfigManager, ThemeManager, PluginManager
- Workspace, WorkspaceUI
- EditorRegistry, EditorStateManager
- CommandManager, TabManager
- SyncManager, BookmarkManager

This follows **Single Responsibility Principle** well.

### 2.3 Plugin System Architecture

**✅ Strong:** Plugin API is well-designed:
- Clear lifecycle (onload/onunload)
- Automatic cleanup of resources
- Multiple extension points (commands, views, settings, markdown processors)
- Good documentation with examples

### 2.4 Native Abstraction Layer

**✅ Smart:** `native/interfaces/` defines platform-agnostic interfaces:
```typescript
IFileSystem, IDialog, IClipboard, IConfig, IMenu, IExport, IFont, IPlatform
```

This enables future multi-platform support (Electron, web).

### 2.5 Documentation Quality

**✅ Comprehensive:** 3,187 lines of documentation covering:
- Architecture overview with diagrams
- Plugin development guide
- Theme system
- CSS architecture
- Contributing guide

---

## 3. Critical Issues

### 3.1 TypeScript Compilation Broken

**🔴 CRITICAL**

```bash
$ bun run typecheck
@inkdown/desktop typecheck: /bin/bash: tsc: command not found
```

**Issue:** TypeScript is not installed or not in PATH. This is a blocker for type safety.

**Impact:**
- No compile-time type checking
- Increased risk of runtime errors
- Can't validate changes before commit

**Fix:**
```bash
# Install TypeScript globally or ensure it's in node_modules/.bin
bun add -D typescript
# Update scripts to use bunx tsc or ./node_modules/.bin/tsc
```

**Recommendation:**
```json
// package.json
"typecheck": "bunx tsc --noEmit",
"typecheck:packages": "bunx tsc -b packages/*/tsconfig.json"
```

---

### 3.2 Test Suite Failures (74% Failure Rate)

**🔴 CRITICAL**

```
27 pass / 76 fail / 8 errors = 74% failure rate
```

**Failing Areas:**
- Tab management (all tests failing)
- Editor smoke tests
- Component integration tests

**Root Cause:** Likely mocking issues with IndexedDB and DOM environment.

**Impact:**
- CI/CD pipeline cannot validate changes
- Regression risk is high
- Developer confidence is low

**Immediate Action Required:**
1. Fix test environment setup (IndexedDB, DOM)
2. Review test isolation and cleanup
3. Add test debugging documentation

---

### 3.3 Missing Error Boundaries

**🔴 CRITICAL (Production Risk)**

**Issue:** No React error boundaries detected in the codebase.

**Impact:**
- App crashes completely on any React error
- Poor user experience
- No error recovery mechanism

**Solution:**
```tsx
// packages/ui/src/components/ErrorBoundary.tsx
export class ErrorBoundary extends React.Component<Props, State> {
    static getDerivedStateFromError(error: Error) {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        app.logger.error('React Error Boundary caught:', error, errorInfo);
        // Optional: Send to error tracking service
    }

    render() {
        if (this.state.hasError) {
            return <ErrorFallback error={this.state.error} />;
        }
        return this.props.children;
    }
}
```

**Apply at:**
1. App root
2. Each major view (editor, settings, file tree)
3. Plugin containers

---

### 3.4 Inconsistent Error Handling

**🔴 CRITICAL**

**Issue:** Error handling varies across the codebase:
```typescript
// Some methods return undefined on error
async loadData<T>(): Promise<T | undefined> { ... }

// Some throw errors
async saveData(data: any): Promise<void> { throw error; }

// Some log and continue silently
```

**Impact:**
- Unpredictable behavior
- Silent failures
- Difficult debugging

**Solution:** Establish consistent error handling strategy:

```typescript
// Option 1: Result type pattern
type Result<T, E = Error> = 
    | { ok: true; value: T }
    | { ok: false; error: E };

async loadData<T>(): Promise<Result<T>> { ... }

// Option 2: Explicit error channel
interface AppError {
    code: string;
    message: string;
    severity: 'error' | 'warning' | 'info';
}

class ErrorManager {
    handleError(error: AppError): void;
    showUserError(message: string): void;
}
```

---

## 4. Important Issues

### 4.1 Manager Coupling and Circular Dependencies Risk

**🟠 IMPORTANT**

**Issue:** The `App` class instantiates all managers, and managers hold references to `App`:

```typescript
export class App {
    workspace: Workspace;
    pluginManager: PluginManager;
    // ... 20+ managers
    
    constructor() {
        this.workspace = new Workspace(this); // Circular ref
        this.pluginManager = new PluginManager(this);
    }
}
```

**Problems:**
1. **Tight coupling:** Managers can access ANY other manager via `this.app.someManager`
2. **Initialization order matters:** Easy to introduce bugs
3. **Testing difficulty:** Hard to unit test managers in isolation
4. **Circular dependency risk:** `App → Manager → App`

**Solution: Dependency Injection**

```typescript
// Define what each manager needs
interface WorkspaceServices {
    fileSystem: FileSystemManager;
    metadataCache: MetadataCache;
    eventBus: EventBus;
}

export class Workspace {
    constructor(private services: WorkspaceServices) {}
    
    async openFile(path: string) {
        const content = await this.services.fileSystem.read(path);
        // ...
    }
}

// In App constructor
this.workspace = new Workspace({
    fileSystem: this.fileSystemManager,
    metadataCache: this.metadataCache,
    eventBus: this.eventBus
});
```

**Benefits:**
- Explicit dependencies
- Easy to mock in tests
- Better encapsulation
- No circular refs

---

### 4.2 Missing Event System Architecture

**🟠 IMPORTANT**

**Issue:** No centralized event bus. Events are scattered:
- Some use callbacks (`onTabChange`)
- Some use EventRefs
- Some use React state

**Problem:**
```typescript
// Plugin wants to react to file changes
// Current: No standard way

// Plugin wants to react to theme changes
// Current: Must poll or hack into ThemeManager
```

**Solution: Event-Driven Architecture**

```typescript
// packages/core/src/EventBus.ts
type EventMap = {
    'file:opened': { path: string; content: string };
    'file:saved': { path: string };
    'file:deleted': { path: string };
    'theme:changed': { theme: string };
    'tab:switched': { tabId: string };
    'editor:content-changed': { path: string; content: string };
};

export class EventBus {
    private listeners = new Map<keyof EventMap, Set<Function>>();
    
    on<K extends keyof EventMap>(
        event: K, 
        handler: (data: EventMap[K]) => void
    ): () => void {
        // Register and return unsubscribe function
    }
    
    emit<K extends keyof EventMap>(event: K, data: EventMap[K]): void {
        // Notify all listeners
    }
}

// Usage in plugins
this.registerEvent(
    app.events.on('file:opened', (data) => {
        console.log('File opened:', data.path);
    })
);
```

**Benefits:**
- Decoupled communication
- Plugins can react to app events
- Easy to add event logging/debugging
- Standard pattern across codebase

---

### 4.3 Plugin Loading Performance

**🟠 IMPORTANT**

**Issue:** Sequential plugin loading blocks app startup:

```typescript
async loadPlugins() {
    for (const plugin of plugins) {
        await this.pluginManager.loadPlugin(plugin); // Blocking!
    }
}
```

**Impact:** 10 plugins × 200ms each = 2 second startup delay

**Solution: Parallel Loading + Priority**

```typescript
interface PluginManifest {
    // ...
    loadPriority?: 'critical' | 'normal' | 'lazy';
}

async loadPlugins() {
    const { critical, normal, lazy } = categorizePlugins(plugins);
    
    // Load critical plugins first (sequential)
    for (const p of critical) {
        await this.loadPlugin(p);
    }
    
    // Load normal plugins in parallel
    await Promise.all(normal.map(p => this.loadPlugin(p)));
    
    // Load lazy plugins in background
    queueMicrotask(() => {
        lazy.forEach(p => this.loadPlugin(p));
    });
}
```

---

### 4.4 IndexedDB Usage Without Versioning Strategy

**🟠 IMPORTANT**

**Issue:** IndexedDB databases opened without migration strategy:

```typescript
const db = await openDB('inkdown-tabs', 1, { ... });
```

**Problem:** When schema changes are needed (v1 → v2), there's no migration path.

**Solution:**

```typescript
// packages/core/src/storage/DatabaseManager.ts
export class DatabaseManager {
    private static VERSION = 3; // Increment when schema changes
    
    async open(name: string): Promise<IDBDatabase> {
        return await openDB(name, DatabaseManager.VERSION, {
            upgrade(db, oldVersion, newVersion) {
                // Migration logic
                if (oldVersion < 2) {
                    // Add new index
                }
                if (oldVersion < 3) {
                    // Add new object store
                }
            }
        });
    }
}
```

---

### 4.5 CSS Architecture Needs Systematization

**🟠 IMPORTANT**

**Issue:** CSS variables are well-used, but:
- No CSS variable naming convention documented
- No CSS layer organization
- No CSS bundling strategy

**Current:**
```css
/* Scattered across files */
--color-primary
--text-primary
--bg-primary
```

**Recommended:**

```css
/* packages/core/src/styles/tokens.css */
:root {
    /* Semantic tokens */
    --color-brand-primary: #6c99bb;
    --color-brand-secondary: #8ab4d7;
    
    /* Component tokens */
    --button-bg: var(--color-brand-primary);
    --button-text: var(--color-text-inverse);
    
    /* State tokens */
    --button-bg-hover: var(--color-brand-secondary);
}

/* CSS Layers for cascade control */
@layer reset, base, components, utilities, overrides;

@layer base {
    :root { /* tokens */ }
}

@layer components {
    .button { /* component styles */ }
}
```

**Add CSS documentation:**
- Token naming convention (BEM, semantic layers)
- Component style organization
- Theme variable requirements

---

## 5. Architecture Improvements

### 5.1 Introduce Service Layer Pattern

**Current:**
```typescript
// Managers do everything: business logic + state + persistence
class PluginManager {
    async loadPlugin() { /* complex logic */ }
    async saveSettings() { /* persistence */ }
    validateManifest() { /* validation */ }
}
```

**Proposed: Service Layer**

```typescript
// services/PluginLoaderService.ts
export class PluginLoaderService {
    async load(manifest: PluginManifest): Promise<Plugin> {
        // Pure loading logic
    }
}

// services/PluginValidationService.ts
export class PluginValidationService {
    validate(manifest: PluginManifest): ValidationResult {
        // Pure validation logic
    }
}

// managers/PluginManager.ts (orchestrator)
export class PluginManager {
    constructor(
        private loader: PluginLoaderService,
        private validator: PluginValidationService,
        private storage: StorageService
    ) {}
    
    async loadPlugin(id: string) {
        const manifest = await this.storage.getManifest(id);
        const validation = this.validator.validate(manifest);
        if (!validation.ok) throw new Error();
        return await this.loader.load(manifest);
    }
}
```

**Benefits:**
- Testable services (no dependencies on App)
- Reusable logic
- Clear responsibilities

---

### 5.2 Add Repository Pattern for Data Access

**Issue:** Data access is scattered (IndexedDB, Tauri FS, Config files)

**Solution:**

```typescript
// repositories/FileRepository.ts
interface FileRepository {
    get(path: string): Promise<File>;
    save(file: File): Promise<void>;
    delete(path: string): Promise<void>;
    list(directory: string): Promise<File[]>;
}

// repositories/TauriFileRepository.ts
export class TauriFileRepository implements FileRepository {
    async get(path: string): Promise<File> {
        const content = await invoke('read_file', { path });
        return { path, content };
    }
}

// repositories/ConfigRepository.ts
export class ConfigRepository {
    async get<T>(key: string): Promise<T>;
    async set<T>(key: string, value: T): Promise<void>;
}
```

**Benefits:**
- Swap implementations (e.g., IndexedDB vs Tauri)
- Easy mocking in tests
- Consistent data access patterns

---

### 5.3 Implement Command Pattern for Undo/Redo

**Current:** No undo/redo system

**Proposed:**

```typescript
// commands/Command.ts
interface Command {
    execute(): Promise<void>;
    undo(): Promise<void>;
    redo(): Promise<void>;
}

// commands/DeleteFileCommand.ts
export class DeleteFileCommand implements Command {
    private fileContent?: string;
    
    constructor(private filePath: string, private workspace: Workspace) {}
    
    async execute() {
        this.fileContent = await this.workspace.read(this.filePath);
        await this.workspace.delete(this.filePath);
    }
    
    async undo() {
        await this.workspace.create(this.filePath, this.fileContent!);
    }
    
    async redo() {
        await this.execute();
    }
}

// CommandHistory.ts
export class CommandHistory {
    private history: Command[] = [];
    private position = -1;
    
    async execute(command: Command) {
        await command.execute();
        this.history = this.history.slice(0, this.position + 1);
        this.history.push(command);
        this.position++;
    }
    
    async undo() {
        if (this.position >= 0) {
            await this.history[this.position].undo();
            this.position--;
        }
    }
}
```

---

### 5.4 Add Feature Flags System

**Use Case:**
- Roll out new features gradually
- A/B testing
- Disable broken features without code changes

```typescript
// FeatureFlags.ts
export enum Feature {
    NEW_SYNC_ENGINE = 'new-sync-engine',
    EXPERIMENTAL_EDITOR = 'experimental-editor',
    AI_COMPLETIONS = 'ai-completions'
}

export class FeatureFlagManager {
    private flags = new Map<Feature, boolean>();
    
    async init() {
        // Load from config
        const config = await loadConfig();
        this.flags = new Map(Object.entries(config.features));
    }
    
    isEnabled(feature: Feature): boolean {
        return this.flags.get(feature) ?? false;
    }
    
    enable(feature: Feature): void {
        this.flags.set(feature, true);
        this.persist();
    }
}

// Usage
if (app.featureFlags.isEnabled(Feature.NEW_SYNC_ENGINE)) {
    return new NewSyncEngine();
} else {
    return new LegacySyncEngine();
}
```

---

## 6. Code Quality Improvements

### 6.1 Add ESLint/Biome Rules for Architecture

**Current:** Biome config is good but lacks architecture rules

**Add:**

```json
// biome.json
{
    "linter": {
        "rules": {
            "nursery": {
                "noBarrelFile": "error",
                "useImportRestrictions": "error"
            }
        }
    },
    "overrides": [
        {
            "includes": ["packages/core/src/**"],
            "linter": {
                "rules": {
                    "suspicious": {
                        "noConsole": "error"  // Use logger instead
                    }
                }
            }
        },
        {
            "includes": ["packages/ui/src/**"],
            "linter": {
                "rules": {
                    "a11y": {
                        "all": "error"  // Strict accessibility
                    }
                }
            }
        }
    ]
}
```

---

### 6.2 Add Pre-commit Hooks

**Install Husky:**

```json
// package.json
{
    "scripts": {
        "prepare": "husky install"
    },
    "devDependencies": {
        "husky": "^9.0.0",
        "lint-staged": "^15.0.0"
    }
}
```

**.husky/pre-commit:**
```bash
#!/bin/sh
bun run lint-staged
```

**lint-staged.config.js:**
```js
export default {
    '*.{ts,tsx}': [
        'biome check --write',
        'vitest related --run'
    ],
    '*.css': ['biome format --write']
};
```

---

### 6.3 Improve Type Safety

**Issue:** Some `any` types and optional typing

**Fixes:**

1. **Enable strict null checks everywhere:**
```json
// tsconfig.base.json
{
    "compilerOptions": {
        "strict": true,
        "strictNullChecks": true,
        "noUncheckedIndexedAccess": true
    }
}
```

2. **Replace `any` with proper types:**
```typescript
// Before
private editorSuggests: any[] = [];

// After
private editorSuggests: EditorSuggest<unknown>[] = [];
```

3. **Add branded types for IDs:**
```typescript
type PluginId = string & { readonly __brand: 'PluginId' };
type TabId = string & { readonly __brand: 'TabId' };
type FilePath = string & { readonly __brand: 'FilePath' };

// Prevents mixing up IDs
function openTab(tabId: TabId) { ... }
openTab('random-string'); // TypeScript error!
```

---

### 6.4 Code Organization: Feature-Based Structure

**Current:** Type-based organization (managers/, components/, utils/)

**Proposed:** Feature-based for plugins and larger modules

```
packages/core/src/
├── features/
│   ├── tabs/
│   │   ├── TabManager.ts
│   │   ├── TabRepository.ts
│   │   ├── TabService.ts
│   │   ├── types.ts
│   │   └── __tests__/
│   ├── plugins/
│   │   ├── PluginManager.ts
│   │   ├── PluginLoader.ts
│   │   ├── PluginValidator.ts
│   │   └── __tests__/
│   └── workspace/
│       ├── Workspace.ts
│       ├── WorkspaceUI.ts
│       └── __tests__/
└── shared/
    ├── types/
    ├── utils/
    └── config/
```

**Benefits:**
- Easier to find related code
- Better module boundaries
- Easier to extract as separate packages later

---

## 7. Testing Strategy

### 7.1 Fix Current Test Suite (Priority 1)

**Action Items:**

1. **Fix IndexedDB mocking:**
```typescript
// test/setup.ts
import 'fake-indexeddb/auto';

global.indexedDB = require('fake-indexeddb').default;
global.IDBKeyRange = require('fake-indexeddb/lib/FDBKeyRange').default;
```

2. **Add test utilities:**
```typescript
// test/utils/createTestApp.ts
export function createTestApp(overrides?: Partial<App>): App {
    const app = new App([]);
    // Mock managers that depend on Tauri
    app.fileSystemManager = new MockFileSystemManager();
    app.configManager = new MockConfigManager();
    return Object.assign(app, overrides);
}
```

3. **Isolate tests:**
```typescript
// Each test should cleanup
afterEach(async () => {
    await app.destroy();
    await clearIndexedDB();
});
```

---

### 7.2 Test Coverage Goals

**Current:** Unknown (no coverage reports)

**Target:**
- **Core**: 80% coverage
- **Managers**: 90% coverage
- **Utils**: 95% coverage
- **UI Components**: 70% coverage

**Add coverage scripts:**
```json
{
    "scripts": {
        "test:coverage": "vitest run --coverage",
        "test:coverage:ui": "vitest --coverage --ui"
    }
}
```

---

### 7.3 Add Integration Tests

**Currently:** Only unit tests

**Add:**
```typescript
// test/integration/plugin-lifecycle.test.ts
describe('Plugin Lifecycle Integration', () => {
    it('should load plugin, execute command, and cleanup', async () => {
        const app = await createIntegrationApp();
        
        // Load plugin
        await app.pluginManager.loadPlugin('test-plugin');
        
        // Execute plugin command
        const command = app.commandManager.getCommand('test-plugin:action');
        await command.execute();
        
        // Verify side effects
        expect(await app.workspace.read('output.md')).toContain('Plugin output');
        
        // Unload and verify cleanup
        await app.pluginManager.unloadPlugin('test-plugin');
        expect(app.commandManager.getCommand('test-plugin:action')).toBeUndefined();
    });
});
```

---

### 7.4 Add E2E Tests

**Tool:** Playwright or Tauri's WebDriver

```typescript
// e2e/basic-workflow.spec.ts
import { test, expect } from '@playwright/test';

test('basic note editing workflow', async ({ page }) => {
    await page.goto('tauri://localhost');
    
    // Create new note
    await page.click('[data-testid="new-note"]');
    
    // Type content
    await page.fill('.cm-content', '# Hello World');
    
    // Save
    await page.keyboard.press('Control+S');
    
    // Verify saved
    await expect(page.locator('[data-testid="file-tree"]')).toContainText('Untitled');
});
```

---

## 8. Project Management

### 8.1 Add CI/CD Pipeline

**Create:** `.github/workflows/ci.yml`

```yaml
name: CI

on: [push, pull_request]

jobs:
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
      
      - name: Run linter
        run: bun run lint
      
      - name: Run type checking
        run: bun run typecheck
      
      - name: Run tests
        run: bun test --run
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3

  build:
    needs: test
    runs-on: ${{ matrix.os }}
    strategy:
      matrix:
        os: [ubuntu-latest, macos-latest, windows-latest]
    
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v1
      
      - name: Install dependencies
        run: bun install
      
      - name: Build
        run: bun run build
      
      - name: Upload artifacts
        uses: actions/upload-artifact@v3
        with:
          name: inkdown-${{ matrix.os }}
          path: apps/desktop/src-tauri/target/release/bundle/
```

---

### 8.2 Add Release Automation

```yaml
# .github/workflows/release.yml
name: Release

on:
  push:
    tags:
      - 'v*'

jobs:
  release:
    runs-on: ${{ matrix.os }}
    strategy:
      matrix:
        os: [ubuntu-latest, macos-latest, windows-latest]
    
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v1
      
      - name: Build
        run: bun run build
      
      - name: Create Release
        uses: tauri-apps/tauri-action@v0
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        with:
          tagName: ${{ github.ref_name }}
          releaseName: 'Inkdown ${{ github.ref_name }}'
          releaseBody: 'See CHANGELOG.md'
          releaseDraft: true
          prerelease: false
```

---

### 8.3 Add Changelog Management

**Tool:** Conventional Commits + Release Please

```json
// package.json
{
    "scripts": {
        "release": "release-please release-pr --token=$GITHUB_TOKEN --repo-url=inkdown/inkdown"
    }
}
```

**Benefits:**
- Auto-generate CHANGELOG.md
- Auto-bump versions
- Create GitHub releases

---

### 8.4 Add Issue Templates

**.github/ISSUE_TEMPLATE/bug_report.yml:**
```yaml
name: Bug Report
description: File a bug report
labels: ["bug"]
body:
  - type: markdown
    attributes:
      value: Thanks for taking the time to fill out this bug report!
  
  - type: input
    id: version
    attributes:
      label: Inkdown Version
      description: What version of Inkdown are you using?
      placeholder: v0.1.0
    validations:
      required: true
  
  - type: textarea
    id: description
    attributes:
      label: Description
      description: A clear description of the bug
    validations:
      required: true
  
  - type: textarea
    id: steps
    attributes:
      label: Steps to Reproduce
      placeholder: |
        1. Open app
        2. Click '...'
        3. See error
    validations:
      required: true
```

---

### 8.5 Project Roadmap

**Create:** `ROADMAP.md`

```markdown
# Inkdown Roadmap

## Q1 2026
- [ ] Stabilize test suite (100% pass rate)
- [ ] Add error boundaries
- [ ] Implement event bus system
- [ ] Release v0.2.0

## Q2 2026
- [ ] Plugin marketplace MVP
- [ ] Real-time collaboration (alpha)
- [ ] Mobile companion app (alpha)
- [ ] Release v0.3.0

## Q3 2026
- [ ] Stable sync system
- [ ] Web clipper extension
- [ ] API for external integrations
- [ ] Release v1.0.0
```

---

## 9. Implementation Roadmap

### Phase 1: Foundation (Weeks 1-2) - CRITICAL

**Goal:** Make the build stable and testable

**Tasks:**
1. ✅ Create refac branch
2. ⬜ Fix TypeScript compilation
3. ⬜ Fix test suite (target: 95% pass rate)
4. ⬜ Add error boundaries to React app
5. ⬜ Implement consistent error handling strategy
6. ⬜ Add pre-commit hooks
7. ⬜ Set up CI/CD pipeline

**Success Criteria:**
- `bun run typecheck` passes
- `bun test` shows >95% pass rate
- CI runs on every PR

---

### Phase 2: Architecture Improvements (Weeks 3-4)

**Goal:** Reduce coupling, improve testability

**Tasks:**
1. ⬜ Implement EventBus system
2. ⬜ Refactor managers to use dependency injection
3. ⬜ Extract service layer from managers
4. ⬜ Add repository pattern for data access
5. ⬜ Document architecture decisions (ADRs)

**Success Criteria:**
- Managers have explicit dependencies
- Unit tests don't require full App instance
- Event system documented and used consistently

---

### Phase 3: Code Quality (Weeks 5-6)

**Goal:** Improve maintainability and safety

**Tasks:**
1. ⬜ Add strict TypeScript rules
2. ⬜ Replace `any` types with proper types
3. ⬜ Organize code by features
4. ⬜ Add CSS layer system
5. ⬜ Improve documentation

**Success Criteria:**
- No `any` types in core
- All public APIs have JSDoc
- CSS variables documented

---

### Phase 4: Testing & Observability (Weeks 7-8)

**Goal:** Confidence in changes

**Tasks:**
1. ⬜ Achieve 80% test coverage
2. ⬜ Add integration tests
3. ⬜ Add E2E test suite (10 critical paths)
4. ⬜ Add performance monitoring
5. ⬜ Add error tracking

**Success Criteria:**
- Coverage reports in CI
- E2E tests run on release builds
- Error dashboard set up

---

### Phase 5: Release (Week 9)

**Goal:** Ship improved architecture

**Tasks:**
1. ⬜ Merge refac branch to main
2. ⬜ Create v0.2.0 release
3. ⬜ Update documentation
4. ⬜ Publish changelog

---

## Summary of Recommendations

### Must Fix (Critical)
1. ✅ TypeScript compilation
2. ✅ Test suite failures
3. ✅ Error boundaries
4. ✅ Consistent error handling

### Should Fix (Important)
5. ✅ Manager coupling (DI)
6. ✅ Event system architecture
7. ✅ Plugin loading performance
8. ✅ IndexedDB versioning strategy
9. ✅ CSS architecture documentation

### Nice to Have (Suggestions)
10. ✅ Service layer pattern
11. ✅ Repository pattern
12. ✅ Command pattern (undo/redo)
13. ✅ Feature flags
14. ✅ CI/CD pipeline
15. ✅ Release automation

---

## Next Steps

1. **Review this document** with the team
2. **Prioritize** which improvements to tackle first
3. **Create GitHub issues** for each task
4. **Assign** tasks to milestones (v0.2.0, v0.3.0, v1.0.0)
5. **Start with Phase 1** - fix the foundation

---

**Questions or feedback?** Open a discussion in the repository.

*Generated on refac branch by Senior Code Reviewer*
