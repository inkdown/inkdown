/**
 * @inkdown/plugin-api
 * 
 * TypeScript definitions for Inkdown plugin development.
 * 
 * This package provides type definitions for building plugins for Inkdown,
 * a powerful markdown editor application.
 * 
 * @example
 * ```typescript
 * import { Plugin, Notice, Setting, PluginSettingTab } from '@inkdown/plugin-api';
 * 
 * export default class MyPlugin extends Plugin {
 *   async onload() {
 *     this.addCommand({
 *       id: 'my-command',
 *       name: 'My Command',
 *       callback: () => new Notice('Hello!'),
 *     });
 *   }
 *   async onunload() {}
 * }
 * ```
 * 
 * @packageDocumentation
 */

// ============================================================================
// Core Types
// ============================================================================

/**
 * Plugin manifest definition
 * This defines the metadata for your plugin
 */
export interface PluginManifest {
    /** Unique identifier for the plugin (lowercase, hyphenated) */
    id: string;
    /** Display name of the plugin */
    name: string;
    /** Semantic version (e.g., "1.0.0") */
    version: string;
    /** Minimum Inkdown version required (e.g., "0.1.0") */
    minAppVersion?: string;
    /** Brief description of the plugin's functionality */
    description: string;
    /** Author name or organization */
    author: string;
    /** URL to author's website or profile */
    authorUrl?: string;
    /** URL to plugin's documentation or repository */
    helpUrl?: string;
    /** URL to plugin repository */
    repo?: string;
    /** Whether the plugin is currently in beta/experimental */
    isBeta?: boolean;
    /** License type (e.g., "MIT", "GPL-3.0") */
    license?: string;
    /** Keywords for search/discovery */
    keywords?: string[];
    /** URL to funding/donation page */
    fundingUrl?: string;
}

/**
 * Command definition for keyboard shortcuts and command palette
 */
export interface Command {
    /** Unique identifier for the command */
    id: string;
    /** Display name shown in command palette */
    name: string;
    /** Function to execute when command is triggered */
    callback: () => void | Promise<void>;
    /** Default hotkey combinations */
    hotkeys?: Hotkey[];
    /** Icon to show in command palette or menus */
    icon?: string;
    /** Callback that receives the editor instance */
    editorCallback?: (editor: IEditor, view: IItemView) => void | Promise<void>;
    /** Callback that can return false to disable the command */
    checkCallback?: (checking: boolean) => boolean;
}

/**
 * Hotkey definition
 */
export interface Hotkey {
    /** Modifier keys: 'Mod' (Ctrl/Cmd), 'Ctrl', 'Meta', 'Alt', 'Shift' */
    modifiers: ('Mod' | 'Ctrl' | 'Meta' | 'Alt' | 'Shift')[];
    /** The key to press */
    key: string;
}

/**
 * Editor position (line and character)
 */
export interface EditorPosition {
    line: number;
    ch: number;
}

/**
 * Editor range (from-to)
 */
export interface EditorRange {
    from: EditorPosition;
    to: EditorPosition;
}

/**
 * Editor transaction for batching changes
 */
export interface EditorTransaction {
    replaceSelection(replacement: string): EditorTransaction;
    setSelection(anchor: EditorPosition, head?: EditorPosition): EditorTransaction;
}

/**
 * Editor interface for plugin developers
 */
export interface IEditor {
    /** Get the full document content */
    getValue(): string;
    /** Set the full document content */
    setValue(content: string): void;
    /** Get the current selection */
    getSelection(): string;
    /** Replace the current selection */
    replaceSelection(replacement: string): void;
    /** Get cursor position */
    getCursor(where?: 'from' | 'to' | 'head' | 'anchor'): EditorPosition;
    /** Set cursor position */
    setCursor(pos: EditorPosition | number): void;
    /** Get a specific line */
    getLine(n: number): string;
    /** Get total line count */
    lineCount(): number;
    /** Get text in range */
    getRange(from: EditorPosition, to: EditorPosition): string;
    /** Replace text in range */
    replaceRange(replacement: string, from: EditorPosition, to?: EditorPosition): void;
    /** Set selection range */
    setSelection(anchor: EditorPosition, head?: EditorPosition): void;
    /** Focus the editor */
    focus(): void;
    /** Blur the editor */
    blur(): void;
    /** Check if editor has focus */
    hasFocus(): boolean;
    /** Scroll position into view */
    scrollIntoView(pos: EditorPosition, margin?: number): void;
    /** Get word at position */
    wordAt(pos: EditorPosition): EditorRange | null;
    /** Execute a transaction */
    transaction(): EditorTransaction;
    /** Get underlying CodeMirror EditorView (if needed for advanced use) */
    cm: any;
}

// ============================================================================
// File System Types
// ============================================================================

/**
 * Abstract file in the file system
 */
export interface TAbstractFile {
    /** File/folder name with extension */
    name: string;
    /** Full path from workspace root */
    path: string;
    /** Parent folder path, or empty string for root items */
    parent: string;
}

/**
 * File in the workspace
 */
export interface TFile extends TAbstractFile {
    /** File extension without dot */
    extension: string;
    /** File statistics */
    stat?: {
        ctime: number;
        mtime: number;
        size: number;
    };
}

/**
 * Folder in the workspace
 */
export interface TFolder extends TAbstractFile {
    /** Child files and folders */
    children: TAbstractFile[];
}

// ============================================================================
// Metadata Cache Types
// ============================================================================

/**
 * Position in a file
 */
export interface Position {
    start: { line: number; col: number; offset: number };
    end: { line: number; col: number; offset: number };
}

/**
 * Cached heading information
 */
export interface HeadingCache {
    heading: string;
    level: number;
    position: Position;
}

/**
 * Cached link information
 */
export interface LinkCache {
    link: string;
    original: string;
    displayText?: string;
    position: Position;
}

/**
 * Cached embed information
 */
export interface EmbedCache {
    link: string;
    original: string;
    displayText?: string;
    position: Position;
}

/**
 * Cached tag information
 */
export interface TagCache {
    tag: string;
    position: Position;
}

/**
 * Cached frontmatter information
 */
export interface FrontMatterCache {
    [key: string]: any;
    position: Position;
}

/**
 * Cached section information
 */
export interface SectionCache {
    type: string;
    position: Position;
    id?: string;
}

/**
 * Cached block information
 */
export interface BlockCache {
    id: string;
    position: Position;
}

/**
 * Complete cached metadata for a file
 */
export interface CachedMetadata {
    headings?: HeadingCache[];
    links?: LinkCache[];
    embeds?: EmbedCache[];
    tags?: TagCache[];
    frontmatter?: FrontMatterCache;
    sections?: SectionCache[];
    blocks?: Record<string, BlockCache>;
}

// ============================================================================
// App Interface
// ============================================================================

/**
 * The main App interface available to plugins
 * This is passed to your plugin constructor
 */
export interface App {
    /** Workspace manager for file operations */
    workspace: IWorkspace;
    /** Metadata cache for file metadata */
    metadataCache: IMetadataCache;
    /** File manager for file operations */
    fileManager: IFileManager;
    /** File system manager for low-level file operations */
    fileSystemManager: IFileSystemManager;
    /** Dialog manager for file/folder selection dialogs */
    dialog: IDialogManager;
    /** Open external link in browser */
    openExternalLink(url: string): void;
}

// ============================================================================
// Dialog Manager Types
// ============================================================================

/**
 * File filter for dialog (e.g., show only PDF files)
 */
export interface FileFilter {
    /** Display name for the filter (e.g., "PDF Files") */
    name: string;
    /** File extensions without dot (e.g., ["pdf", "doc"]) */
    extensions: string[];
}

/**
 * Options for file dialogs
 */
export interface FileDialogOptions {
    /** Dialog window title */
    title?: string;
    /** Default directory to open */
    defaultPath?: string;
    /** File filters to show */
    filters?: FileFilter[];
    /** Default file name (for save dialog) */
    defaultName?: string;
}

/**
 * Options for folder dialogs
 */
export interface FolderDialogOptions {
    /** Dialog window title */
    title?: string;
    /** Default directory to open */
    defaultPath?: string;
}

/**
 * Dialog manager for native file/folder selection dialogs
 * 
 * @example
 * ```ts
 * // Save file dialog
 * const path = await this.app.dialog.showSaveDialog({
 *   title: 'Export PDF',
 *   defaultName: 'document.pdf',
 *   filters: [{ name: 'PDF Files', extensions: ['pdf'] }]
 * });
 * if (path) {
 *   await writeBinaryFile(path, pdfData);
 * }
 * 
 * // Open file dialog
 * const file = await this.app.dialog.showOpenFileDialog({
 *   title: 'Select Image',
 *   filters: [{ name: 'Images', extensions: ['png', 'jpg', 'gif'] }]
 * });
 * 
 * // Select folder
 * const folder = await this.app.dialog.showOpenFolderDialog({
 *   title: 'Select Output Folder'
 * });
 * ```
 */
export interface IDialogManager {
    /**
     * Show a save file dialog
     * @param options - Dialog options
     * @returns The selected file path, or null if cancelled
     */
    showSaveDialog(options?: FileDialogOptions): Promise<string | null>;
    
    /**
     * Show an open file dialog (single file selection)
     * @param options - Dialog options
     * @returns The selected file path, or null if cancelled
     */
    showOpenFileDialog(options?: FileDialogOptions): Promise<string | null>;
    
    /**
     * Show an open file dialog (multiple file selection)
     * @param options - Dialog options
     * @returns Array of selected file paths (empty if cancelled)
     */
    showOpenFilesDialog(options?: FileDialogOptions): Promise<string[]>;
    
    /**
     * Show a folder selection dialog
     * @param options - Dialog options
     * @returns The selected folder path, or null if cancelled
     */
    showOpenFolderDialog(options?: FolderDialogOptions): Promise<string | null>;
}

/**
 * Workspace manager
 */
export interface IWorkspace {
    /** Get the currently active file */
    getActiveFile(): TFile | null;
    /** Get all markdown files */
    getMarkdownFiles(): TFile[];
    /** Get all files */
    getFiles(): TFile[];
    /** Get file by path */
    getAbstractFileByPath(path: string): TAbstractFile | null;
    /** Get root folder */
    getRoot(): TFolder;
}

/**
 * Metadata cache manager
 */
export interface IMetadataCache {
    /** Get cached metadata for a file */
    getFileCache(file: TFile): CachedMetadata | null;
    /** Get first link path destination */
    getFirstLinkpathDest(linkpath: string, sourcePath: string): TFile | null;
    /** Resolve subpath */
    resolveSubpath(file: TFile, subpath: string): { start: Position; end: Position } | null;
}

/**
 * File manager for file operations
 */
export interface IFileManager {
    /** Read file contents */
    read(file: TFile): Promise<string>;
    /** Write file contents */
    write(file: TFile, data: string): Promise<void>;
    /** Create a new file */
    create(path: string, data?: string): Promise<TFile>;
    /** Delete a file */
    delete(file: TFile): Promise<void>;
    /** Rename a file */
    rename(file: TFile, newPath: string): Promise<void>;
    /** Copy a file */
    copy(file: TFile, newPath: string): Promise<TFile>;
}

/**
 * File system manager for low-level file operations
 * Used for operations outside the workspace, like saving exports
 */
export interface IFileSystemManager {
    /** Read file contents as string */
    readFile(path: string): Promise<string>;
    /** Write text file */
    writeFile(path: string, content: string): Promise<void>;
    /** Write binary file (base64 encoded) */
    writeFileBinary(path: string, base64Content: string): Promise<void>;
    /** Create a directory */
    createDirectory(path: string): Promise<void>;
    /** Check if path exists */
    exists(path: string): Promise<boolean>;
    /** Delete a file or directory */
    delete(path: string): Promise<void>;
    /** Copy a file */
    copyFile(source: string, destination: string): Promise<void>;
}

// ============================================================================
// UI Components - Interfaces
// ============================================================================

/**
 * View creator function type
 */
export type ViewCreator = () => IItemView;

/**
 * Item view interface
 */
export interface IItemView extends IComponent {
    app: App;
    containerEl: HTMLElement;
    contentEl: HTMLElement;
    
    /** Get the view type identifier */
    getViewType(): string;
    /** Get the display text for the view */
    getDisplayText(): string;
    /** Get the icon for the view */
    getIcon(): string;
    /** Called when the view is opened */
    onOpen(): Promise<void> | void;
    /** Called when the view is closed */
    onClose(): Promise<void>;
    /** Called when the view is resized */
    onResize(): void;
}

/**
 * Component interface for lifecycle management
 */
export interface IComponent {
    /** Load the component */
    load(): void;
    /** Called when the component is loaded */
    onload(): void;
    /** Unload the component */
    unload(): void;
    /** Called when the component is unloaded */
    onunload(): void;
    /** Add a child component */
    addChild<T extends IComponent>(component: T): T;
    /** Remove a child component */
    removeChild(component: IComponent): void;
    /** Register a callback for cleanup */
    register(cb: () => void): void;
    /** Register an interval for cleanup */
    registerInterval(id: number): number;
}

/**
 * Plugin interface
 */
export interface IPlugin extends IComponent {
    /** Reference to the app instance */
    app: App;
    /** The plugin manifest containing metadata */
    manifest: PluginManifest;
    /** Whether the plugin is currently enabled */
    enabled: boolean;

    /** Called when the plugin is loaded */
    onload(): Promise<void>;
    /** Called when the plugin is unloaded */
    onunload(): Promise<void>;

    /** Load plugin data */
    loadData<T = any>(): Promise<T | undefined>;
    /** Save plugin data */
    saveData(data: any): Promise<void>;

    /** Add a command */
    addCommand(command: Command): Command;
    /** Register a command */
    registerCommand(command: Command): void;
    /** Register a custom view */
    registerView(viewType: string, viewCreator: ViewCreator): void;
    /** Add a settings tab */
    addSettingTab(tab: IPluginSettingTab): void;
    /** Add a ribbon icon */
    addRibbonIcon(icon: string, title: string, callback: () => void): HTMLElement;
    /** Add a status bar item */
    addStatusBarItem(): HTMLElement;

    /** Register an event handler */
    registerEvent(eventRef: () => void): void;
    /** Register a DOM event */
    registerDomEvent<K extends keyof HTMLElementEventMap>(
        el: HTMLElement | Document | Window,
        type: K,
        callback: (ev: HTMLElementEventMap[K]) => any,
        options?: boolean | AddEventListenerOptions,
    ): void;
    /** Register an interval */
    setInterval(callback: () => void, interval: number): number;

    /** Register an editor suggest */
    registerEditorSuggest(suggest: IEditorSuggest<any>): void;
    /** Register a markdown code block processor */
    registerMarkdownCodeBlockProcessor(
        language: string,
        processor: MarkdownCodeBlockProcessor,
    ): void;
    /** Register a markdown post processor */
    registerMarkdownPostProcessor(processor: MarkdownPostProcessor): void;
    /** Register a CodeMirror editor extension */
    registerEditorExtension(extension: any): void;
    /** Add inline CSS styles */
    addStyle(css: string): void;
    /** Show a toast notification */
    showNotice(message: string | DocumentFragment, duration?: number): INotice;
}

// ============================================================================
// Modal Interfaces
// ============================================================================

/**
 * Modal interface
 */
export interface IModal {
    /** Reference to the app */
    app: App;
    /** The modal overlay element */
    modalEl: HTMLElement;
    /** The modal container element */
    containerEl: HTMLElement;
    /** The title element */
    titleEl: HTMLElement;
    /** The content element */
    contentEl: HTMLElement;
    /** Whether the modal should close when clicking outside */
    shouldCloseOnOverlayClick: boolean;
    /** Keyboard scope for this modal */
    scope: IKeyboardScope;

    /** Set the modal title */
    setTitle(title: string): this;
    /** Set the modal content */
    setContent(content: string | DocumentFragment): this;
    /** Open the modal */
    open(): void;
    /** Close the modal */
    close(): void;
    /** Called when the modal is opened */
    onOpen(): void;
    /** Called when the modal is closed */
    onClose(): void;
}

/**
 * Keyboard scope interface
 */
export interface IKeyboardScope {
    /** Register a key handler */
    register(
        modifiers: ('Mod' | 'Ctrl' | 'Meta' | 'Alt' | 'Shift')[],
        key: string,
        callback: (evt: KeyboardEvent) => boolean | void,
    ): void;
    /** Unregister all handlers */
    unregister(): void;
}

// ============================================================================
// Notice Interface
// ============================================================================

/**
 * Notice interface
 */
export interface INotice {
    /** The notice element */
    noticeEl: HTMLElement;
    /** Update the notice message */
    setMessage(message: string | DocumentFragment): this;
    /** Hide the notice */
    hide(): void;
}

// ============================================================================
// Setting Interfaces
// ============================================================================

/**
 * Setting text input component
 */
export interface SettingTextComponent {
    inputEl: HTMLInputElement;
    getValue(): string;
    setValue(value: string): SettingTextComponent;
    setPlaceholder(placeholder: string): SettingTextComponent;
    onChange(callback: (value: string) => void): SettingTextComponent;
    setDisabled(disabled: boolean): SettingTextComponent;
}

/**
 * Setting textarea component
 */
export interface SettingTextAreaComponent {
    inputEl: HTMLTextAreaElement;
    getValue(): string;
    setValue(value: string): SettingTextAreaComponent;
    setPlaceholder(placeholder: string): SettingTextAreaComponent;
    onChange(callback: (value: string) => void): SettingTextAreaComponent;
    setDisabled(disabled: boolean): SettingTextAreaComponent;
}

/**
 * Setting toggle component
 */
export interface SettingToggleComponent {
    toggleEl: HTMLElement;
    getValue(): boolean;
    setValue(value: boolean): SettingToggleComponent;
    onChange(callback: (value: boolean) => void): SettingToggleComponent;
    setDisabled(disabled: boolean): SettingToggleComponent;
}

/**
 * Setting dropdown component
 */
export interface SettingDropdownComponent {
    selectEl: HTMLSelectElement;
    getValue(): string;
    setValue(value: string): SettingDropdownComponent;
    addOption(value: string, display: string): SettingDropdownComponent;
    addOptions(options: Record<string, string>): SettingDropdownComponent;
    onChange(callback: (value: string) => void): SettingDropdownComponent;
    setDisabled(disabled: boolean): SettingDropdownComponent;
}

/**
 * Setting slider component
 */
export interface SettingSliderComponent {
    sliderEl: HTMLInputElement;
    getValue(): number;
    setValue(value: number): SettingSliderComponent;
    setLimits(min: number, max: number, step: number | 'any'): SettingSliderComponent;
    setDynamicTooltip(): SettingSliderComponent;
    onChange(callback: (value: number) => void): SettingSliderComponent;
    setDisabled(disabled: boolean): SettingSliderComponent;
}

/**
 * Setting button component
 */
export interface SettingButtonComponent {
    buttonEl: HTMLButtonElement;
    setButtonText(text: string): SettingButtonComponent;
    setIcon(icon: string): SettingButtonComponent;
    setCta(): SettingButtonComponent;
    setWarning(): SettingButtonComponent;
    setDisabled(disabled: boolean): SettingButtonComponent;
    onClick(callback: () => void): SettingButtonComponent;
}

/**
 * Setting extra button component
 */
export interface SettingExtraButtonComponent {
    extraSettingsEl: HTMLElement;
    setIcon(icon: string): SettingExtraButtonComponent;
    setTooltip(tooltip: string): SettingExtraButtonComponent;
    setDisabled(disabled: boolean): SettingExtraButtonComponent;
    onClick(callback: () => void): SettingExtraButtonComponent;
}

/**
 * Setting color picker component
 */
export interface SettingColorPickerComponent {
    colorPickerEl: HTMLInputElement;
    getValue(): string;
    setValue(value: string): SettingColorPickerComponent;
    onChange(callback: (value: string) => void): SettingColorPickerComponent;
}

/**
 * Setting interface
 */
export interface ISetting {
    settingEl: HTMLElement;
    infoEl: HTMLElement;
    nameEl: HTMLElement;
    descEl: HTMLElement;
    controlEl: HTMLElement;

    /** Set the setting name */
    setName(name: string | DocumentFragment): this;
    /** Set the setting description */
    setDesc(desc: string | DocumentFragment): this;
    /** Mark as heading */
    setHeading(): this;
    /** Add custom CSS class */
    setClass(cls: string): this;
    /** Set disabled state */
    setDisabled(disabled: boolean): this;

    /** Add a text input */
    addText(cb: (component: SettingTextComponent) => void): this;
    /** Add a textarea */
    addTextArea(cb: (component: SettingTextAreaComponent) => void): this;
    /** Add a toggle switch */
    addToggle(cb: (component: SettingToggleComponent) => void): this;
    /** Add a dropdown select */
    addDropdown(cb: (component: SettingDropdownComponent) => void): this;
    /** Add a slider */
    addSlider(cb: (component: SettingSliderComponent) => void): this;
    /** Add a button */
    addButton(cb: (component: SettingButtonComponent) => void): this;
    /** Add an extra button */
    addExtraButton(cb: (component: SettingExtraButtonComponent) => void): this;
    /** Add a color picker */
    addColorPicker(cb: (component: SettingColorPickerComponent) => void): this;
}

// ============================================================================
// Plugin Setting Tab Interface
// ============================================================================

/**
 * Plugin setting tab interface
 */
export interface IPluginSettingTab {
    /** Reference to the app */
    app: App;
    /** Reference to the plugin */
    plugin: IPlugin;
    /** Container element for settings */
    containerEl: HTMLElement;
    /** Tab name displayed in sidebar */
    name: string;

    /** Called when the tab is displayed */
    display(): void;
    /** Called when the tab is hidden */
    hide(): void;
}

// ============================================================================
// Suggest Interfaces
// ============================================================================

/**
 * Search match result
 */
export interface SearchMatch {
    /** Matched indices for highlighting */
    matches: number[][];
    /** Match score (higher is better) */
    score: number;
}

/**
 * Fuzzy match result
 */
export interface FuzzyMatch<T> {
    /** The matched item */
    item: T;
    /** Match information */
    match: SearchMatch;
}

/**
 * Popover suggest interface
 */
export interface IPopoverSuggest<T, TContext = string> {
    containerEl: HTMLElement;
    
    /** Get suggestions for the context */
    getSuggestions(context: TContext): T[] | Promise<T[]>;
    /** Render a suggestion item */
    renderSuggestion(value: T, el: HTMLElement): void;
    /** Select a suggestion */
    selectSuggestion(value: T, evt: MouseEvent | KeyboardEvent): void;
    /** Update suggestions */
    updateSuggestions(context: TContext): Promise<void>;
}

/**
 * Fuzzy suggest modal interface
 */
export interface IFuzzySuggestModal<T> extends IModal {
    inputEl: HTMLInputElement;
    resultContainerEl: HTMLElement;

    /** Get all items to search through */
    getItems(): T[];
    /** Get the text to search for an item */
    getItemText(item: T): string;
    /** Called when an item is selected */
    onChooseItem(item: T, evt: MouseEvent | KeyboardEvent): void;
    /** Render a suggestion */
    renderSuggestion(match: FuzzyMatch<T>, el: HTMLElement): void;
    /** Get suggestions based on query */
    getSuggestions(query: string): FuzzyMatch<T>[];
    /** Select a suggestion */
    selectSuggestion(match: FuzzyMatch<T>, evt: MouseEvent | KeyboardEvent): void;
}

// ============================================================================
// Editor Suggest Interface
// ============================================================================

/**
 * Trigger information for editor suggest
 */
export interface EditorSuggestTriggerInfo {
    /** Start position of trigger */
    start: EditorPosition;
    /** End position (cursor) */
    end: EditorPosition;
    /** Query string */
    query: string;
}

/**
 * Context passed to getSuggestions
 */
export interface EditorSuggestContext extends EditorSuggestTriggerInfo {
    /** Editor instance (CodeMirror EditorView) */
    editor: any;
    /** Current file */
    file: TFile | null;
}

/**
 * Editor suggest interface
 */
export interface IEditorSuggest<T> extends IPopoverSuggest<T, EditorSuggestContext> {
    /** Current context */
    context: EditorSuggestContext | null;

    /** Check if suggestions should trigger */
    onTrigger(
        cursor: EditorPosition,
        editor: any,
        file: TFile | null,
    ): EditorSuggestTriggerInfo | null;

    /** Close the suggest popup */
    close(): void;
}

// ============================================================================
// Markdown Processing
// ============================================================================

/**
 * Context for markdown post processors
 */
export interface MarkdownPostProcessorContext {
    /** Path of the source file */
    sourcePath: string;
    /** Frontmatter data */
    frontmatter?: any;
    /** Add a child element */
    addChild(child: HTMLElement): void;
    /** Get section info */
    getSectionInfo(el: HTMLElement): SectionInfo | null;
}

/**
 * Section info for markdown processing
 */
export interface SectionInfo {
    /** Section text */
    text: string;
    /** Line start */
    lineStart: number;
    /** Line end */
    lineEnd: number;
}

/**
 * Markdown code block processor function
 */
export type MarkdownCodeBlockProcessor = (
    source: string,
    el: HTMLElement,
    ctx: MarkdownPostProcessorContext,
) => void | Promise<void>;

/**
 * Markdown post processor function
 */
export type MarkdownPostProcessor = (
    el: HTMLElement,
    ctx: MarkdownPostProcessorContext,
) => void | Promise<void>;

// ============================================================================
// Events
// ============================================================================

/**
 * Event reference for cleanup
 */
export interface EventRef {
    unload(): void;
}

/**
 * Events interface
 */
export interface IEvents {
    /** Register an event handler */
    on(name: string, callback: Function): EventRef;
    /** Unregister an event handler */
    off(name: string, callback: Function): void;
    /** Unregister all handlers */
    offAll(name?: string): void;
}

// ============================================================================
// DOM Extensions
// ============================================================================

/**
 * Element creation info
 */
export interface DomElementInfo {
    /** CSS class(es) */
    cls?: string | string[];
    /** Text content */
    text?: string;
    /** Title attribute */
    title?: string;
    /** Value attribute */
    value?: string;
    /** Placeholder attribute */
    placeholder?: string;
    /** Type attribute */
    type?: string;
    /** Href attribute */
    href?: string;
    /** Parent element */
    parent?: HTMLElement;
    /** Other attributes */
    attr?: { [key: string]: string | number | boolean | null };
    /** Prepend instead of append */
    prepend?: boolean;
}

// Extend HTMLElement with Inkdown's DOM extensions
declare global {
    interface HTMLElement {
        /** Create an element */
        createEl<K extends keyof HTMLElementTagNameMap>(
            tag: K,
            o?: DomElementInfo | string,
            callback?: (el: HTMLElementTagNameMap[K]) => void,
        ): HTMLElementTagNameMap[K];

        /** Create a div */
        createDiv(o?: DomElementInfo | string): HTMLDivElement;

        /** Create a span */
        createSpan(o?: DomElementInfo | string): HTMLSpanElement;

        /** Set text content */
        setText(text: string): void;

        /** Empty the element */
        empty(): void;

        /** Add class */
        addClass(...classes: string[]): void;

        /** Remove class */
        removeClass(...classes: string[]): void;

        /** Toggle class */
        toggleClass(cls: string, value?: boolean): void;

        /** Check if has class */
        hasClass(cls: string): boolean;

        /** Find first matching element */
        find(selector: string): HTMLElement | null;

        /** Find all matching elements */
        findAll(selector: string): HTMLElement[];
    }

    interface Document {
        /** Create a div */
        createDiv(o?: DomElementInfo | string): HTMLDivElement;

        /** Create a span */
        createSpan(o?: DomElementInfo | string): HTMLSpanElement;
    }
}

// ============================================================================
// Abstract Base Classes (for extending)
// ============================================================================

/**
 * Component - Base class for lifecycle management
 * Extend this class and override onload/onunload
 */
export declare abstract class Component implements IComponent {
    load(): void;
    onload(): void;
    unload(): void;
    onunload(): void;
    addChild<T extends Component>(component: T): T;
    removeChild(component: Component): void;
    register(cb: () => void): void;
    registerInterval(id: number): number;
}

/**
 * Plugin - Base class for all Inkdown plugins
 * 
 * @example
 * ```typescript
 * export default class MyPlugin extends Plugin {
 *   async onload() {
 *     this.addCommand({
 *       id: 'my-command',
 *       name: 'My Command',
 *       callback: () => new Notice('Hello!'),
 *     });
 *   }
 *   async onunload() {}
 * }
 * ```
 */
export declare abstract class Plugin extends Component implements IPlugin {
    app: App;
    manifest: PluginManifest;
    enabled: boolean;

    constructor(app: App, manifest: PluginManifest);

    abstract onload(): Promise<void>;
    abstract onunload(): Promise<void>;

    loadData<T = any>(): Promise<T | undefined>;
    saveData(data: any): Promise<void>;
    addCommand(command: Command): Command;
    registerCommand(command: Command): void;
    registerView(viewType: string, viewCreator: ViewCreator): void;
    addSettingTab(tab: IPluginSettingTab): void;
    addRibbonIcon(icon: string, title: string, callback: () => void): HTMLElement;
    addStatusBarItem(): HTMLElement;
    registerEvent(eventRef: () => void): void;
    registerDomEvent<K extends keyof HTMLElementEventMap>(
        el: HTMLElement | Document | Window,
        type: K,
        callback: (ev: HTMLElementEventMap[K]) => any,
        options?: boolean | AddEventListenerOptions,
    ): void;
    setInterval(callback: () => void, interval: number): number;
    registerEditorSuggest(suggest: IEditorSuggest<any>): void;
    registerMarkdownCodeBlockProcessor(
        language: string,
        processor: MarkdownCodeBlockProcessor,
    ): void;
    registerMarkdownPostProcessor(processor: MarkdownPostProcessor): void;
    registerEditorExtension(extension: any): void;
    addStyle(css: string): void;
    showNotice(message: string | DocumentFragment, duration?: number): INotice;
}

/**
 * ItemView - Base class for custom views
 */
export declare abstract class ItemView extends Component implements IItemView {
    app: App;
    containerEl: HTMLElement;
    contentEl: HTMLElement;

    constructor(app: App);

    abstract getViewType(): string;
    abstract getDisplayText(): string;
    getIcon(): string;
    abstract onOpen(): Promise<void> | void;
    onClose(): Promise<void>;
    onResize(): void;
}

/**
 * Modal - Base class for modal dialogs
 * 
 * @example
 * ```typescript
 * class MyModal extends Modal {
 *   onOpen() {
 *     this.contentEl.createEl('h2', { text: 'Hello!' });
 *   }
 *   onClose() {
 *     this.contentEl.empty();
 *   }
 * }
 * ```
 */
export declare abstract class Modal implements IModal {
    app: App;
    modalEl: HTMLElement;
    containerEl: HTMLElement;
    titleEl: HTMLElement;
    contentEl: HTMLElement;
    shouldCloseOnOverlayClick: boolean;
    scope: KeyboardScope;

    constructor(app: App);

    setTitle(title: string): this;
    setContent(content: string | DocumentFragment): this;
    open(): void;
    close(): void;
    abstract onOpen(): void;
    abstract onClose(): void;
}

/**
 * ConfirmModal - Modal for yes/no confirmations
 */
export declare class ConfirmModal extends Modal {
    constructor(
        app: App,
        title: string,
        message: string,
        confirmText?: string,
        cancelText?: string,
    );

    onConfirm(callback: () => void): this;
    onCancel(callback: () => void): this;
    onOpen(): void;
    onClose(): void;
}

/**
 * KeyboardScope - Handle keyboard shortcuts in a context
 */
export declare class KeyboardScope implements IKeyboardScope {
    register(
        modifiers: ('Mod' | 'Ctrl' | 'Meta' | 'Alt' | 'Shift')[],
        key: string,
        callback: (evt: KeyboardEvent) => boolean | void,
    ): void;
    unregister(): void;
}

/**
 * Notice - Toast notification
 * 
 * @example
 * ```typescript
 * new Notice('File saved!');
 * new Notice('Processing...', 5000);
 * ```
 */
export declare class Notice implements INotice {
    noticeEl: HTMLElement;

    constructor(message: string | DocumentFragment, duration?: number);

    setMessage(message: string | DocumentFragment): this;
    hide(): void;
}

/**
 * Setting - Build settings UI
 * 
 * @example
 * ```typescript
 * new Setting(containerEl)
 *   .setName('My Setting')
 *   .addToggle(toggle => toggle.setValue(true));
 * ```
 */
export declare class Setting implements ISetting {
    settingEl: HTMLElement;
    infoEl: HTMLElement;
    nameEl: HTMLElement;
    descEl: HTMLElement;
    controlEl: HTMLElement;

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
 * PluginSettingTab - Base class for plugin settings
 * 
 * @example
 * ```typescript
 * class MySettingTab extends PluginSettingTab {
 *   display() {
 *     this.containerEl.empty();
 *     new Setting(this.containerEl).setName('Test');
 *   }
 * }
 * ```
 */
export declare abstract class PluginSettingTab implements IPluginSettingTab {
    app: App;
    plugin: Plugin;
    containerEl: HTMLElement;
    name: string;

    constructor(app: App, plugin: Plugin);

    abstract display(): void;
    hide(): void;
}

/**
 * PopoverSuggest - Base class for suggestion popovers
 */
export declare abstract class PopoverSuggest<T, TContext = string> implements IPopoverSuggest<T, TContext> {
    containerEl: HTMLElement;

    constructor(app: App, containerEl: HTMLElement);

    abstract getSuggestions(context: TContext): T[] | Promise<T[]>;
    abstract renderSuggestion(value: T, el: HTMLElement): void;
    abstract selectSuggestion(value: T, evt: MouseEvent | KeyboardEvent): void;
    updateSuggestions(context: TContext): Promise<void>;
}

/**
 * FuzzySuggestModal - Modal with fuzzy search
 * 
 * @example
 * ```typescript
 * class FileSuggest extends FuzzySuggestModal<TFile> {
 *   getItems() { return this.app.workspace.getMarkdownFiles(); }
 *   getItemText(file: TFile) { return file.name; }
 *   onChooseItem(file: TFile) { console.log(file); }
 * }
 * ```
 */
export declare abstract class FuzzySuggestModal<T> extends Modal implements IFuzzySuggestModal<T> {
    inputEl: HTMLInputElement;
    resultContainerEl: HTMLElement;

    constructor(app: App);

    abstract getItems(): T[];
    abstract getItemText(item: T): string;
    abstract onChooseItem(item: T, evt: MouseEvent | KeyboardEvent): void;

    renderSuggestion(match: FuzzyMatch<T>, el: HTMLElement): void;
    getSuggestions(query: string): FuzzyMatch<T>[];
    selectSuggestion(match: FuzzyMatch<T>, evt: MouseEvent | KeyboardEvent): void;
    onOpen(): void;
    onClose(): void;
}

/**
 * EditorSuggest - Autocomplete in the editor
 * 
 * @example
 * ```typescript
 * class MentionSuggest extends EditorSuggest<User> {
 *   onTrigger(cursor, editor, file) {
 *     // Return trigger info or null
 *   }
 *   getSuggestions(ctx) { return []; }
 *   renderSuggestion(user, el) { el.setText(user.name); }
 *   selectSuggestion(user, evt) { 
 *     // Insert the selected suggestion
 *   }
 * }
 * ```
 */
export declare abstract class EditorSuggest<T> extends PopoverSuggest<T, EditorSuggestContext> implements IEditorSuggest<T> {
    context: EditorSuggestContext | null;

    constructor(app: App);

    abstract onTrigger(
        cursor: EditorPosition,
        editor: any,
        file: TFile | null,
    ): EditorSuggestTriggerInfo | null;

    abstract getSuggestions(context: EditorSuggestContext): T[] | Promise<T[]>;
    abstract renderSuggestion(value: T, el: HTMLElement): void;
    abstract selectSuggestion(value: T, evt: MouseEvent | KeyboardEvent): void;

    close(): void;
}

/**
 * Events - Base class for event emitters
 */
export declare class Events implements IEvents {
    on(name: string, callback: Function): EventRef;
    off(name: string, callback: Function): void;
    offAll(name?: string): void;
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Set an icon on an element
 */
export declare function setIcon(el: HTMLElement, icon: string): void;
