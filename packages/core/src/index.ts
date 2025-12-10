/**
 * @inkdown/core
 *
 * Core business logic, plugin system, and state management for Inkdown
 */

import './extensions'; // Load DOM extensions

// Core classes
export { App } from './App';
export { CommunityPluginManager } from './CommunityPluginManager';
export { CommunityThemeManager } from './CommunityThemeManager';
// Views
export { Component } from './Component';
export { ConfigManager } from './ConfigManager';
export type {
    EditorSuggestContext,
    EditorSuggestTriggerInfo,
} from './components/EditorSuggest';
export { EditorSuggest } from './components/EditorSuggest';
export type { FuzzyMatch, SearchMatch } from './components/FuzzySuggestModal';
export { FuzzySuggestModal, PopoverSuggest } from './components/FuzzySuggestModal';
export { ConfirmModal, KeyboardScope, Modal } from './components/Modal';
export { injectNoticeStyles, Notice } from './components/Notice';
export { PluginSettingTab } from './components/PluginSettingTab';
export type {
    SettingButtonComponent,
    SettingColorPickerComponent,
    SettingDropdownComponent,
    SettingExtraButtonComponent,
    SettingSliderComponent,
    SettingTextAreaComponent,
    SettingTextComponent,
    SettingToggleComponent,
} from './components/Setting';
// Plugin API Components
export { Setting } from './components/Setting';
export { OnboardingScreen } from './components/sync/OnboardingScreen';
export type { FileDialogOptions, FileFilter, FolderDialogOptions } from './DialogManager';
export { DialogManager } from './DialogManager';
export { EditorRegistry } from './EditorRegistry';
export { EditorStateManager } from './EditorStateManager';
export type { EventRef } from './Events';
export { Events } from './Events';
export * from './editor/commands';
export type { EditorProps } from './editor/Editor';
// Editor (moved from @inkdown/editor package)
export { Editor } from './editor/Editor'; // React component
export type {
    Editor as IEditor, // Interface for plugin developers
    EditorPosition,
    EditorRange,
    EditorTransaction,
} from './editor/EditorAdapter';
export { EditorAdapter } from './editor/EditorAdapter';
export type { EditorConfig } from './editor/extensions';
// Editor configurable extensions
export {
    createCloseBracketsExtension,
    createConfigurableExtensions,
    createHeadingFoldExtension,
    createLineNumbersExtension,
    createPasteHtmlToMarkdownExtension,
    createTabIndentationExtension,
    createVimModeExtension,
    DEFAULT_EDITOR_CONFIG,
    editorCompartments,
    getReconfigurationEffects,
} from './editor/extensions';
export {
    createCustomizableKeymap,
    createMarkdownKeymap,
    EDITOR_COMMANDS,
    executeEditorCommand,
    getEditorCommand,
    registerEditorCommands,
} from './editor/keymaps';
export { createInkdownTheme } from './editor/theme/codemirror-theme';
export type { DomElementInfo } from './extensions';
export type { FileNode } from './filesystem/FileSystemManager';
export { FileSystemManager } from './filesystem/FileSystemManager';
export { BookmarkManager } from './managers/BookmarkManager';
export type { DataWriteOptions } from './managers/FileManager';
export { FileManager } from './managers/FileManager';
export type { FilesConfig } from './managers/FilesConfigManager';
export { DEFAULT_FILES_CONFIG, FilesConfigManager } from './managers/FilesConfigManager';
export { FontManager } from './managers/FontManager';
export type {
    BlockCache,
    CachedMetadata,
    EmbedCache,
    FrontMatterCache,
    HeadingCache,
    LinkCache,
    Position,
    SectionCache,
    TagCache,
} from './managers/MetadataCache';
export { MetadataCache } from './managers/MetadataCache';
export { SyncManager } from './managers/SyncManager';
export type { WindowConfig, WindowState } from './managers/WindowConfigManager';
export {
    DEFAULT_WINDOW_CONFIG,
    DEFAULT_WINDOW_STATE,
    WindowConfigManager,
} from './managers/WindowConfigManager';
export type { TAbstractFile, TFile, TFolder } from './managers/Workspace';
export { Workspace } from './managers/Workspace';
export { WorkspaceHistory } from './managers/WorkspaceHistory';
export { WorkspaceUI } from './managers/WorkspaceUI';
export type {
    MarkdownCodeBlockProcessor,
    MarkdownPostProcessor,
    MarkdownPostProcessorContext,
    SectionInfo,
} from './markdown/MarkdownProcessor';
// Markdown processing
export { MarkdownProcessorRegistry } from './markdown/MarkdownProcessor';
export { Plugin } from './Plugin';
export type {
    PluginChangeListener,
    PluginChangeType,
    PluginConfig,
    PluginInfo,
} from './PluginManager';
export { PluginManager } from './PluginManager';
export { ShortcutManager } from './ShortcutManager';
// Sync
export { AuthService } from './sync/AuthService';
export { DeviceManager } from './sync/DeviceManager';
export { EncryptionManager } from './sync/EncryptionManager';
export { LocalDatabase } from './sync/LocalDatabase';
export type { SyncConflict, SyncLogEntry, SyncLogLevel } from './sync/SyncLogger';
export { getSyncLogger, SyncLogger } from './sync/SyncLogger';
export { TokenManager } from './sync/TokenManager';
export * from './sync/types';
export { TabManager } from './TabManager';
export { ThemeManager } from './ThemeManager';
export type {
    Bookmark,
    BookmarkEvents,
    BookmarkGroup,
    BookmarksConfig,
} from './types/bookmarks';
export type {
    CommunityPlugin,
    CommunityPluginCache,
    CommunityPluginListing,
    CommunityPluginManifest,
    InstalledCommunityPlugin,
    InstalledPluginsConfig,
    PluginInstallResult,
    PluginLoadResult,
    PluginUpdateInfo,
} from './types/community-plugin';
export type {
    CommunityTheme,
    CommunityThemeCache,
    CommunityThemeListing,
    CommunityThemeManifest,
    InstalledCommunityTheme,
    InstalledThemesConfig,
} from './types/community-theme';
export type {
    AppConfig,
    FontConfig,
    RecentWorkspace,
    TabConfig,
} from './types/config';
// Types
export type {
    Command,
    Hotkey,
    IPlugin,
    PluginManifest,
    SettingTab,
    SettingTabProps,
    ViewCreator,
} from './types/plugin';
export type {
    DefaultShortcuts,
    KeyboardShortcut,
    ModifierKey,
    ShortcutConfig,
    ShortcutsConfig,
} from './types/shortcuts';
export type {
    Tab,
    TabContent,
    TabOptions,
    TabState,
} from './types/tab';
export type {
    ColorScheme,
    ThemeConfig,
    ThemeManifest,
} from './types/theme';
// Icon utilities (only setIcon is exported - addIcon/hasIcon/getIcon are internal)
export { setIcon } from './utils/icons';
export type { Logger } from './utils/logger';
// Logger
export { baseLogger, createLogger, loggers } from './utils/logger';
export { ItemView } from './views/ItemView';
