# React Native Abstraction Architecture Plan

## Executive Summary

This plan outlines the architecture changes needed to support React Native mobile apps while maintaining compatibility with the existing Tauri desktop application. The core challenge is that React Native doesn't support IndexedDB (used for caching) or CodeMirror (used for editing), requiring abstraction layers for both storage and editor functionality.

## Current Architecture Analysis

### Package Structure
```
inkdown/
├── apps/
│   └── desktop/              # Tauri desktop app
├── packages/
│   ├── core/                 # Core business logic (97 TypeScript files)
│   ├── native-tauri/         # Tauri-specific native implementations
│   ├── plugin-api/           # Plugin TypeScript definitions
│   ├── plugins/              # Built-in plugins
│   └── ui/                   # React UI components
```

### Current Dependencies

**Storage Layer:**
- `packages/core/src/sync/LocalDatabase.ts` - Direct IndexedDB usage
- `packages/core/src/TabManager.ts` - Uses `idb` library for tab caching
- Both use in-memory caching with IndexedDB persistence

**Editor Layer:**
- `packages/core/src/editor/` - 25+ files tightly coupled to CodeMirror 6
- `packages/core/src/editor/EditorAdapter.ts` - Provides plugin-friendly interface
- Direct imports of `@codemirror/*` packages throughout

**Native Abstraction (Already Exists):**
- `packages/core/src/native/NativeBridge.ts` - Singleton pattern
- `packages/core/src/native/interfaces/` - Platform interfaces (IFileSystem, IDialog, etc.)
- `packages/native-tauri/` - Tauri implementations

## Problems to Solve

### 1. Storage Abstraction
**Problem:** IndexedDB not available in React Native
**Impact:** 
- Sync system (LocalDatabase)
- Tab caching (TabManager)
- Any plugin that uses IndexedDB

**React Native Alternatives:**
- AsyncStorage (simple key-value, 6MB limit)
- WatermelonDB (SQLite-based, good for complex queries)
- MMKV (fast key-value storage)
- expo-sqlite (direct SQLite access)

### 2. Editor Abstraction
**Problem:** CodeMirror not available in React Native (DOM-dependent)
**Impact:**
- Core editor functionality
- Plugin system (many plugins extend editor)
- Syntax highlighting
- Vim mode
- Custom commands

**React Native Alternatives:**
- react-native-webview + CodeMirror (hybrid approach)
- Custom native text input (limited features)
- Markdown-focused libraries (react-native-markdown-editor)

### 3. Plugin Compatibility
**Problem:** Plugins may use platform-specific APIs
**Impact:**
- Community plugins need to work on both platforms
- Plugin API needs platform detection

## Proposed Architecture

### Storage Abstraction Layer

Create a new `IStorage` interface that abstracts all persistence operations:

```
packages/
├── core/
│   └── src/
│       └── storage/
│           ├── IStorage.ts              # Storage interface
│           ├── IKVStorage.ts            # Key-value interface
│           ├── IDocumentStorage.ts      # Document/object interface
│           └── StorageBridge.ts         # Singleton manager
├── storage-indexeddb/                   # NEW: IndexedDB implementation
│   └── src/
│       ├── IndexedDBStorage.ts
│       ├── IndexedDBKVStorage.ts
│       └── IndexedDBDocumentStorage.ts
└── storage-react-native/                # NEW: React Native implementation
    └── src/
        ├── SQLiteStorage.ts
        ├── MMKVStorage.ts
        └── adapters/
```

### Editor Abstraction Layer

Enhance existing `EditorAdapter` into a full abstraction:

```
packages/
├── core/
│   └── src/
│       └── editor/
│           ├── IEditor.ts               # Enhanced editor interface
│           ├── IEditorView.ts           # View abstraction
│           ├── IEditorState.ts          # State abstraction
│           └── EditorBridge.ts          # Singleton manager
├── editor-codemirror/                   # NEW: Extract CodeMirror implementation
│   └── src/
│       ├── CodeMirrorEditor.tsx
│       ├── CodeMirrorAdapter.ts
│       ├── extensions/
│       ├── commands/
│       └── keymaps/
└── editor-react-native/                 # NEW: React Native implementation
    └── src/
        ├── WebViewEditor.tsx            # CodeMirror in WebView
        ├── NativeEditor.tsx             # Pure React Native (limited)
        └── adapters/
```

## Detailed Implementation Plan

### Phase 1: Storage Abstraction (Week 1-2)

#### 1.1 Define Storage Interfaces
**File:** `packages/core/src/storage/IStorage.ts`

```typescript
export interface IKVStorage {
  get<T>(key: string): Promise<T | undefined>;
  set<T>(key: string, value: T): Promise<void>;
  delete(key: string): Promise<void>;
  clear(): Promise<void>;
  keys(): Promise<string[]>;
}

export interface IDocumentStorage<T = any> {
  get(id: string): Promise<T | undefined>;
  getAll(): Promise<T[]>;
  query(filter: Partial<T>): Promise<T[]>;
  put(doc: T): Promise<void>;
  delete(id: string): Promise<void>;
  createIndex(field: string): Promise<void>;
}

export interface IStorageTransaction {
  commit(): Promise<void>;
  rollback(): Promise<void>;
}
```

#### 1.2 Create StorageBridge
**File:** `packages/core/src/storage/StorageBridge.ts`

```typescript
class StorageBridge {
  private static instance: StorageBridge;
  private kvStorage?: IKVStorage;
  private documentStorages: Map<string, IDocumentStorage> = new Map();
  
  registerKVStorage(impl: IKVStorage): void;
  registerDocumentStorage(name: string, impl: IDocumentStorage): void;
  
  // Getters with validation
  get kv(): IKVStorage;
  getDocumentStorage<T>(name: string): IDocumentStorage<T>;
}
```

#### 1.3 Refactor LocalDatabase
**Changes to:** `packages/core/src/sync/LocalDatabase.ts`

- Replace direct IndexedDB calls with `StorageBridge` calls
- Keep in-memory cache (platform-agnostic)
- Extract IndexedDB-specific code to new package

**Before:**
```typescript
const request = globalThis.indexedDB.open(this.dbName, 2);
```

**After:**
```typescript
const storage = StorageBridge.getInstance().getDocumentStorage('sync');
```

#### 1.4 Refactor TabManager
**Changes to:** `packages/core/src/TabManager.ts`

- Replace `idb` usage with `IKVStorage`
- Use `StorageBridge.getInstance().kv` for tab cache

#### 1.5 Create IndexedDB Package
**New package:** `packages/storage-indexeddb/`

- Move IndexedDB implementation from core
- Implement `IKVStorage` and `IDocumentStorage`
- Export registration function

#### 1.6 Create React Native Storage Package
**New package:** `packages/storage-react-native/`

- Implement using WatermelonDB or expo-sqlite
- Provide same interfaces
- Handle migration from iOS/Android native storage

**Success Criteria:**
- ✅ All sync tests pass with IndexedDB implementation
- ✅ Storage layer has zero direct IndexedDB references in core
- ✅ Mock storage implementation works in tests

---

### Phase 2: Editor Abstraction (Week 3-4)

#### 2.1 Extract CodeMirror to Separate Package
**New package:** `packages/editor-codemirror/`

Move these directories:
- `packages/core/src/editor/` → `packages/editor-codemirror/src/`
- Keep only `EditorAdapter.ts` interface in core

**Structure:**
```
packages/editor-codemirror/
├── src/
│   ├── CodeMirrorEditor.tsx          # Main editor component
│   ├── CodeMirrorAdapter.ts          # Implements IEditor
│   ├── extensions/
│   │   ├── index.ts
│   │   ├── highlight-syntax.ts
│   │   └── ...
│   ├── commands/
│   │   ├── formatting.ts
│   │   ├── lists.ts
│   │   └── ...
│   ├── keymaps/
│   ├── theme/
│   └── styles/
└── package.json
```

#### 2.2 Enhance Editor Interface
**File:** `packages/core/src/editor/IEditor.ts`

```typescript
export interface IEditor {
  // Core operations (already exists in EditorAdapter)
  getSelection(): string;
  replaceSelection(replacement: string): void;
  getValue(): string;
  setValue(content: string): void;
  
  // New: Platform detection
  getPlatform(): 'desktop' | 'mobile' | 'web';
  
  // New: Feature detection
  supportsFeature(feature: EditorFeature): boolean;
  
  // New: Extension system
  registerExtension(ext: IEditorExtension): void;
}

export enum EditorFeature {
  VimMode = 'vim-mode',
  SyntaxHighlighting = 'syntax-highlighting',
  AutoComplete = 'autocomplete',
  MultiCursor = 'multi-cursor',
  // ... more features
}
```

#### 2.3 Create EditorBridge
**File:** `packages/core/src/editor/EditorBridge.ts`

```typescript
class EditorBridge {
  private static instance: EditorBridge;
  private editorFactory?: IEditorFactory;
  
  registerFactory(factory: IEditorFactory): void {
    this.editorFactory = factory;
  }
  
  createEditor(container: HTMLElement | ViewRef, options: EditorOptions): IEditor {
    if (!this.editorFactory) {
      throw new Error('No editor factory registered');
    }
    return this.editorFactory.create(container, options);
  }
}
```

#### 2.4 Create React Native Editor Package
**New package:** `packages/editor-react-native/`

**Option A: WebView-based (Recommended for MVP)**
```typescript
// Uses react-native-webview with CodeMirror
export class WebViewEditor implements IEditor {
  // Communicates with CodeMirror via postMessage
  // Full feature parity with desktop
}
```

**Option B: Native (Future enhancement)**
```typescript
// Uses React Native TextInput with custom markdown rendering
export class NativeEditor implements IEditor {
  // Limited features but fully native
  supportsFeature(feature: EditorFeature): boolean {
    // Return false for advanced features
  }
}
```

**Success Criteria:**
- ✅ Desktop app uses `editor-codemirror` package
- ✅ Core has zero direct CodeMirror imports
- ✅ Editor interface supports feature detection
- ✅ Plugins work with abstracted editor

---

### Phase 3: Plugin Compatibility Layer (Week 5)

#### 3.1 Enhance Plugin API
**File:** `packages/plugin-api/src/index.d.ts`

```typescript
export interface Plugin {
  // Existing fields...
  
  // New: Platform support declaration
  platforms?: {
    desktop?: boolean;
    mobile?: boolean;
    web?: boolean;
  };
  
  // New: Required features
  requiredFeatures?: EditorFeature[];
}

export interface PluginManifest {
  // New: Conditional loading
  loadCondition?: (ctx: PlatformContext) => boolean;
}
```

#### 3.2 Platform Context
**File:** `packages/core/src/Platform.ts`

```typescript
export class Platform {
  static get current(): 'desktop' | 'mobile' | 'web' {
    // Detect platform
  }
  
  static get isMobile(): boolean {
    return this.current === 'mobile';
  }
  
  static get storage(): 'indexeddb' | 'sqlite' | 'asyncstorage' {
    // Return storage type
  }
  
  static get editor(): 'codemirror' | 'webview' | 'native' {
    // Return editor type
  }
}
```

#### 3.3 Plugin Manager Enhancement
**Changes to:** `packages/core/src/PluginManager.ts`

```typescript
async loadPlugin(manifest: PluginManifest): Promise<void> {
  // Check platform compatibility
  if (manifest.platforms && !manifest.platforms[Platform.current]) {
    throw new Error(`Plugin not supported on ${Platform.current}`);
  }
  
  // Check required features
  if (manifest.requiredFeatures) {
    const unsupported = manifest.requiredFeatures.filter(
      feat => !this.app.editor.supportsFeature(feat)
    );
    if (unsupported.length > 0) {
      throw new Error(`Plugin requires: ${unsupported.join(', ')}`);
    }
  }
  
  // Existing load logic...
}
```

**Success Criteria:**
- ✅ Plugins can declare platform support
- ✅ Plugin loading fails gracefully on unsupported platforms
- ✅ Feature detection prevents incompatible plugin activation

---

### Phase 4: React Native App Setup (Week 6-7)

#### 4.1 Create React Native App Package
**New package:** `apps/mobile/`

```
apps/mobile/
├── android/
├── ios/
├── src/
│   ├── App.tsx
│   ├── screens/
│   ├── components/
│   └── native/                # React Native bridge implementations
│       ├── FileSystem.ts
│       ├── Storage.ts
│       └── Platform.ts
├── package.json
└── app.json
```

#### 4.2 Register Platform Implementations
**File:** `apps/mobile/src/App.tsx`

```typescript
import { NativeBridge } from '@inkdown/core/native';
import { StorageBridge } from '@inkdown/core/storage';
import { EditorBridge } from '@inkdown/core/editor';
import { registerRNAdapters } from '@inkdown/native-react-native';
import { SQLiteStorage } from '@inkdown/storage-react-native';
import { WebViewEditorFactory } from '@inkdown/editor-react-native';

export default function App() {
  useEffect(() => {
    // Register native implementations
    registerRNAdapters();
    
    // Register storage
    StorageBridge.getInstance().registerKVStorage(new SQLiteStorage());
    
    // Register editor
    EditorBridge.getInstance().registerFactory(new WebViewEditorFactory());
    
    // Initialize app
    initializeApp();
  }, []);
  
  return <AppContainer />;
}
```

#### 4.3 Create React Native Native Bridge
**New package:** `packages/native-react-native/`

```
packages/native-react-native/
└── src/
    ├── index.ts                    # Registration function
    ├── FileSystem.ts               # expo-file-system wrapper
    ├── Platform.ts                 # React Native Platform API
    ├── Dialog.ts                   # react-native-modal, etc.
    └── Clipboard.ts                # @react-native-clipboard
```

**Success Criteria:**
- ✅ React Native app boots successfully
- ✅ All native bridges registered
- ✅ Storage and editor work on iOS simulator
- ✅ Storage and editor work on Android emulator

---

### Phase 5: Sync System Validation (Week 8)

#### 5.1 Test Sync with Mobile Storage
- Create notes on mobile → Sync to server
- Create notes on desktop → Sync to mobile
- Test directory operations
- Test empty files
- Test offline queue

#### 5.2 Performance Optimization
- Benchmark SQLite vs IndexedDB performance
- Optimize large file batching
- Add pagination for mobile list views

#### 5.3 Mobile-Specific Sync Features
- Background sync (iOS/Android)
- Cellular data preferences
- Battery optimization

**Success Criteria:**
- ✅ All sync integration tests pass with SQLite storage
- ✅ Cross-platform sync works (desktop ↔ mobile)
- ✅ Mobile app handles 1000+ notes smoothly

---

## Package Dependencies After Migration

```
Dependency Graph:

@inkdown/core (platform-agnostic)
  ├── Uses: IStorage, IEditor, INative interfaces
  └── No direct platform dependencies

@inkdown/storage-indexeddb
  ├── Implements: IStorage interfaces
  ├── Depends: @inkdown/core, idb
  └── Used by: apps/desktop

@inkdown/storage-react-native
  ├── Implements: IStorage interfaces
  ├── Depends: @inkdown/core, expo-sqlite
  └── Used by: apps/mobile

@inkdown/editor-codemirror
  ├── Implements: IEditor interface
  ├── Depends: @inkdown/core, @codemirror/*
  └── Used by: apps/desktop

@inkdown/editor-react-native
  ├── Implements: IEditor interface
  ├── Depends: @inkdown/core, react-native-webview
  └── Used by: apps/mobile

@inkdown/native-tauri
  ├── Implements: INative interfaces
  ├── Depends: @inkdown/core, @tauri-apps/*
  └── Used by: apps/desktop

@inkdown/native-react-native (new)
  ├── Implements: INative interfaces
  ├── Depends: @inkdown/core, expo-*, react-native-*
  └── Used by: apps/mobile

apps/desktop
  ├── Depends: @inkdown/core, @inkdown/ui
  ├── Depends: @inkdown/storage-indexeddb
  ├── Depends: @inkdown/editor-codemirror
  └── Depends: @inkdown/native-tauri

apps/mobile (new)
  ├── Depends: @inkdown/core, @inkdown/ui
  ├── Depends: @inkdown/storage-react-native
  ├── Depends: @inkdown/editor-react-native
  └── Depends: @inkdown/native-react-native
```

## Migration Strategy

### Backward Compatibility
- Maintain existing APIs during migration
- Use feature flags for gradual rollout
- Keep desktop app working throughout

### Testing Strategy
1. Unit tests for each abstraction layer
2. Integration tests with mock implementations
3. Platform-specific E2E tests
4. Cross-platform sync tests

### Rollout Plan
1. Phase 1: Storage abstraction (desktop only, verify no regression)
2. Phase 2: Editor abstraction (desktop only, verify no regression)
3. Phase 3: Plugin compatibility (desktop only)
4. Phase 4-5: Mobile app development
5. Beta testing with mobile users
6. Production release

## Risk Mitigation

### Risk 1: Performance Degradation
**Mitigation:**
- Benchmark before/after each phase
- Keep in-memory caching
- Profile mobile app performance early

### Risk 2: Plugin Breakage
**Mitigation:**
- Maintain backward compatibility
- Provide migration guide for plugin authors
- Add deprecation warnings before breaking changes

### Risk 3: Sync Issues Across Platforms
**Mitigation:**
- Extensive cross-platform testing
- Use same sync protocol/encryption
- Test with existing desktop database migrations

### Risk 4: Mobile Editor Limitations
**Mitigation:**
- Start with WebView (full features)
- Document feature limitations
- Provide fallback for unsupported features

## Timeline Estimate

| Phase | Duration | Dependencies |
|-------|----------|--------------|
| 1. Storage Abstraction | 2 weeks | None |
| 2. Editor Abstraction | 2 weeks | Phase 1 |
| 3. Plugin Compatibility | 1 week | Phase 2 |
| 4. React Native App | 2 weeks | Phase 1-3 |
| 5. Sync Validation | 1 week | Phase 4 |
| **Total** | **8 weeks** | Sequential |

## Success Metrics

### Technical Metrics
- [ ] Zero direct platform dependencies in `@inkdown/core`
- [ ] All existing tests pass with new abstractions
- [ ] Mobile app boots in <2 seconds
- [ ] Sync latency <500ms on mobile

### User Metrics
- [ ] Desktop app performance unchanged
- [ ] Mobile app supports 95% of desktop features
- [ ] Plugin compatibility rate >90%
- [ ] Cross-platform sync success rate >99%

## Open Questions

1. **Editor Strategy:** WebView or native? Recommend WebView for MVP, native for v2
2. **Storage Choice:** SQLite or WatermelonDB? Recommend expo-sqlite for simplicity
3. **Plugin Distribution:** Separate mobile plugin store? Start with shared, filter by platform
4. **Offline Support:** How much data to cache? Start with last 100 notes, configurable

## Next Steps

1. **Review this plan** with team
2. **Spike on storage abstraction** (2 days) - prove concept with small POC
3. **Spike on editor abstraction** (2 days) - test WebView performance
4. **Create detailed task breakdown** for Phase 1
5. **Set up project tracking** (GitHub project board)
6. **Begin Phase 1 implementation**

---

**Plan Author:** GitHub Copilot  
**Date:** 2026-01-03  
**Status:** Draft - Pending Review  
**Version:** 1.0
