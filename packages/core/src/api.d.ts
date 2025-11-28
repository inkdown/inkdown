/**
 * Inkdown Plugin API Type Definitions
 *
 * This file contains the complete type definitions for the Inkdown plugin API.
 *
 * @module @inkdown/core
 */

// ========================================
// Core Application
// ========================================

/**
 * Main application instance
 * Available to all plugins via `this.app`
 */
export interface App {
    /** Plugin manager */
    pluginManager: PluginManager;
    /** Theme manager */
    themeManager: ThemeManager;
    /** Configuration manager */
    configManager: ConfigManager;
    /** Keyboard shortcut manager */
    shortcutManager: ShortcutManager;
    /** Tab manager */
    tabManager: TabManager;
    /** File system manager */
    fileSystemManager: FileSystemManager;
    /** Workspace (file operations) */
    workspace: Workspace;
    /** Workspace UI (UI state) */
    workspaceUI: WorkspaceUI;
    /** File manager */
    fileManager: FileManager;
    /** Metadata cache */
    metadataCache: MetadataCache;
    /** Markdown processor */
    markdownProcessor: MarkdownProcessorRegistry;
    /** Editor state manager */
    editorStateManager: EditorStateManager;
    /** Editor registry */
    editorRegistry: EditorRegistry;
}

// ========================================
// Plugin System
// ========================================

/**
 * Plugin manifest - describes the plugin
 */
export interface PluginManifest {
    /** Unique plugin ID (kebab-case) */
    id: string;
    /** Display name */
    name: string;
    /** Version (semver) */
    version: string;
    /** Description */
    description: string;
    /** Author name */
    author: string;
    /** Minimum required Inkdown version */
    minAppVersion?: string;
}

/**
 * Base plugin class
 * All plugins should extend this class
 *
 * @example
 * ```ts
 * export default class MyPlugin extends Plugin {
 *   async onload() {
 *     console.log('Plugin loaded');
 *     this.addCommand({
 *       id: 'my-command',
 *       name: 'My Command',
 *       callback: () => console.log('Command executed')
 *     });
 *   }
 *
 *   async onunload() {
 *     console.log('Plugin unloaded');
 *   }
 * }
 * ```
 */
export abstract class Plugin {
    /** Application instance */
    app: App;
    /** Plugin manifest */
    manifest: PluginManifest;

    /** Called when plugin is loaded */
    abstract onload(): Promise<void> | void;
    /** Called when plugin is unloaded */
    abstract onunload(): Promise<void> | void;

    /** Load plugin data */
    loadData(): Promise<any>;
    /** Save plugin data */
    saveData(data: any): Promise<void>;

    /** Register a command */
    addCommand(command: Command): void;
    /** Register a settings tab */
    addSettingTab(tab: PluginSettingTab): void;
    /** Add ribbon icon */
    addRibbonIcon(icon: string, title: string, callback: () => void): HTMLElement;
    /** Add status bar item */
    addStatusBarItem(): HTMLElement;

    /** Register event handler */
    registerEvent(eventRef: EventRef): void;
    /** Register DOM event handler */
    registerDomEvent<K extends keyof WindowEventMap>(
        el: Window | Document | HTMLElement,
        type: K,
        callback: (this: HTMLElement, ev: WindowEventMap[K]) => any,
    ): void;
    /** Register interval */
    registerInterval(id: number): number;

    /** Register editor suggest */
    registerEditorSuggest(suggest: EditorSuggest<any>): void;
    /** Register markdown code block processor */
    registerMarkdownCodeBlockProcessor(
        language: string,
        handler: (source: string, el: HTMLElement) => void | Promise<void>,
    ): void;
    /** Register markdown post processor */
    registerMarkdownPostProcessor(processor: (el: HTMLElement) => void | Promise<void>): void;
    /** Register editor extension */
    registerEditorExtension(extension: any): void;
}

// ========================================
// Commands
// ========================================

/**
 * Command definition
 */
export interface Command {
    /** Unique command ID */
    id: string;
    /** Display name */
    name: string;
    /** Icon (optional) */
    icon?: string;
    /** Hotkey (optional) */
    hotkeys?: Hotkey[];
    /** Simple callback */
    callback?: () => any;
    /** Check callback (conditional execution) */
    checkCallback?: (checking: boolean) => boolean | void;
    /** Editor callback */
    editorCallback?: (editor: Editor) => any;
    /** Editor check callback (conditional) */
    editorCheckCallback?: (checking: boolean, editor: Editor) => boolean | void;
}

/**
 * Hotkey definition
 */
export interface Hotkey {
    modifiers: Array<'Mod' | 'Ctrl' | 'Meta' | 'Shift' | 'Alt'>;
    key: string;
}

// ========================================
// File System
// ========================================

/**
 * File object
 */
export interface TFile {
    /** Full path */
    path: string;
    /** File name with extension */
    name: string;
    /** File name without extension */
    basename: string;
    /** File extension */
    extension: string;
    /** File statistics */
    stat: {
        size: number;
        mtime: number;
        ctime: number;
    };
}

/**
 * Folder object
 */
export interface TFolder {
    /** Full path */
    path: string;
    /** Folder name */
    name: string;
    /** Children files/folders */
    children: TAbstractFile[];
}

/**
 * Abstract file (file or folder)
 */
export type TAbstractFile = TFile | TFolder;

// ========================================
// Workspace (File Operations)
// ========================================

/**
 * Workspace - File operations and events
 */
export interface Workspace {
    /** Get all files */
    getAllFiles(): Promise<TFile[]>;
    /** Get markdown files */
    getMarkdownFiles(): Promise<TFile[]>;
    /** Get files with specific extensions */
    getFiles(extensions: string[]): Promise<TFile[]>;
    /** Get file by path */
    getAbstractFileByPath(path: string): TAbstractFile | null;

    /** Read file */
    read(file: TFile): Promise<string>;
    /** Modify file */
    modify(file: TFile, content: string): Promise<void>;
    /** Create file */
    create(path: string, content?: string): Promise<TFile>;
    /** Delete file */
    delete(file: TAbstractFile): Promise<void>;
    /** Rename file */
    rename(file: TAbstractFile, newPath: string): Promise<void>;
    /** Copy file */
    copy(file: TFile, newPath: string): Promise<TFile>;

    /** Listen to file creation */
    onFileCreate(callback: (file: TFile) => void): EventRef;
    /** Listen to file modification */
    onFileModify(callback: (file: TFile) => void): EventRef;
    /** Listen to file deletion */
    onFileDelete(callback: (file: TAbstractFile) => void): EventRef;
    /** Listen to file rename */
    onFileRename(callback: (file: TFile, oldPath: string) => void): EventRef;
}

// ========================================
// Workspace UI
// ========================================

/**
 * WorkspaceUI - UI state management
 */
export interface WorkspaceUI {
    /** Get active file from tab */
    getActiveFile(): TFile | null;
    /** Open file in tab */
    openFile(file: TFile, newTab?: boolean): Promise<void>;
    /** Get active view of type */
    getActiveViewOfType<T>(type: new (...args: any[]) => T): T | null;

    /** Listen to active file changes */
    onActiveFileChange(callback: (file: TFile | null) => void): EventRef;
    /** Listen to file open events */
    onFileOpen(callback: (file: TFile) => void): EventRef;
    /** Listen to layout changes */
    onLayoutChange(callback: () => void): EventRef;
}

// ========================================
// Editor
// ========================================

/**
 * Editor position
 */
export interface EditorPosition {
    line: number;
    ch: number;
}

/**
 * Editor range
 */
export interface EditorRange {
    from: EditorPosition;
    to: EditorPosition;
}

/**
 * Editor interface
 * Abstraction over CodeMirror
 */
export interface Editor {
    /** Get selection */
    getSelection(): string;
    /** Replace selection */
    replaceSelection(replacement: string): void;
    /** Get range */
    getRange(from: EditorPosition, to: EditorPosition): string;
    /** Replace range */
    replaceRange(replacement: string, from: EditorPosition, to?: EditorPosition): void;

    /** Get cursor position */
    getCursor(type?: 'from' | 'to' | 'head' | 'anchor'): EditorPosition;
    /** Set cursor position */
    setCursor(pos: EditorPosition | number): void;
    /** Set selection */
    setSelection(anchor: EditorPosition | number, head?: EditorPosition | number): void;

    /** Get entire content */
    getValue(): string;
    /** Set entire content */
    setValue(content: string): void;
    /** Get line */
    getLine(line: number): string;
    /** Line count */
    lineCount(): number;
    /** Last line number */
    lastLine(): number;

    /** Position to offset */
    posToOffset(pos: EditorPosition): number;
    /** Offset to position */
    offsetToPos(offset: number): EditorPosition;

    /** Scroll into view */
    scrollIntoView(range?: EditorRange): void;
    /** Focus editor */
    focus(): void;
    /** Check if focused */
    hasFocus(): boolean;
}

// ========================================
// Settings UI
// ========================================

/**
 * Setting builder
 */
export class Setting {
    settingEl: HTMLElement;

    constructor(containerEl: HTMLElement);

    setName(name: string | DocumentFragment): this;
    setDesc(desc: string | DocumentFragment): this;
    setHeading(): this;
    setClass(cls: string): this;
    setDisabled(disabled: boolean): this;

    addText(cb: (component: SettingTextComponent) => void): this;
    addTextArea(cb: (component: SettingTextAreaComponent) => void): this;
    addToggle(cb: (component: SettingToggleComponent) => void): this;
    addDropdown(cb: (component: SettingDropdownComponent) => void): this;
    addSlider(cb: (component: SettingSliderComponent) => void): this;
    addButton(cb: (component: SettingButtonComponent) => void): this;
    addExtraButton(cb: (component: SettingExtraButtonComponent) => void): this;
    addColorPicker(cb: (component: SettingColorPickerComponent) => void): this;
}

/**
 * Plugin settings tab
 */
export abstract class PluginSettingTab {
    app: App;
    plugin: Plugin;
    containerEl: HTMLElement;

    abstract display(): void | Promise<void>;
    hide(): void;
}

// ========================================
// Modals
// ========================================

/**
 * Base modal class
 */
export abstract class Modal {
    app: App;
    containerEl: HTMLElement;
    modalEl: HTMLElement;
    titleEl: HTMLElement;
    contentEl: HTMLElement;

    constructor(app: App);

    open(): void;
    close(): void;
    abstract onOpen(): void;
    abstract onClose(): void;
}

/**
 * Fuzzy suggest modal
 */
export abstract class FuzzySuggestModal<T> extends Modal {
    abstract getItems(): T[] | Promise<T[]>;
    abstract getItemText(item: T): string;
    abstract onChooseItem(item: T, evt: MouseEvent | KeyboardEvent): void;
}

// ========================================
// Editor Suggest
// ========================================

/**
 * Editor suggest - autocompletion in editor
 */
export abstract class EditorSuggest<T> {
    constructor(app: App);

    abstract onTrigger(
        cursor: EditorPosition,
        editor: any,
        file: TFile | null,
    ): EditorSuggestTriggerInfo | null;

    abstract getSuggestions(context: EditorSuggestContext): T[] | Promise<T[]>;
    abstract renderSuggestion(value: T, el: HTMLElement): void;
    abstract selectSuggestion(value: T, evt: MouseEvent | KeyboardEvent): void;
}

export interface EditorSuggestTriggerInfo {
    start: EditorPosition;
    end: EditorPosition;
    query: string;
}

export interface EditorSuggestContext extends EditorSuggestTriggerInfo {
    editor: any;
    file: TFile | null;
}

// ========================================
// Metadata Cache
// ========================================

/**
 * Metadata cache
 */
export interface MetadataCache {
    getCache(path: string): CachedMetadata | null;
    getFileCache(path: string): CachedMetadata | null;
}

/**
 * Cached metadata
 */
export interface CachedMetadata {
    frontmatter?: FrontMatterCache;
    links?: LinkCache[];
    embeds?: EmbedCache[];
    tags?: TagCache[];
    headings?: HeadingCache[];
}

export interface FrontMatterCache {
    [key: string]: any;
}

export interface LinkCache {
    link: string;
    original: string;
    displayText?: string;
    position: Position;
}

export interface EmbedCache extends LinkCache { }

export interface TagCache {
    tag: string;
    position: Position;
}

export interface HeadingCache {
    heading: string;
    level: number;
    position: Position;
}

export interface Position {
    start: { line: number; col: number; offset: number };
    end: { line: number; col: number; offset: number };
}

// ========================================
// Events
// ========================================

/**
 * Event reference for unsubscribing
 */
export interface EventRef {
    unsubscribe(): void;
}

// ========================================
// Utilities
// ========================================

/**
 * Set icon on element
 */
export function setIcon(element: HTMLElement, iconId: string): Promise<void>;

/**
 * Notice (toast notification)
 */
export class Notice {
    constructor(message: string | DocumentFragment, duration?: number);
    hide(): void;
}
