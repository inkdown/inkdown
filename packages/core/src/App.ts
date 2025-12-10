import type { ViewUpdate } from '@codemirror/view';
import { CommunityPluginManager } from './CommunityPluginManager';
import { CommunityThemeManager } from './CommunityThemeManager';
import { ConfigManager } from './ConfigManager';
import type { EditorSuggest } from './components/EditorSuggest';
import { injectNoticeStyles } from './components/Notice';
import { DialogManager } from './DialogManager';
import { EditorRegistry } from './EditorRegistry';
import { EditorStateManager } from './EditorStateManager';
import { FileSystemManager } from './filesystem/FileSystemManager';
import { BookmarkManager } from './managers/BookmarkManager';
import { FileManager } from './managers/FileManager';
import { FilesConfigManager } from './managers/FilesConfigManager';
import { FontManager } from './managers/FontManager';
import { MetadataCache } from './managers/MetadataCache';
import { SyncManager } from './managers/SyncManager';
import { WindowConfigManager } from './managers/WindowConfigManager';
import { Workspace } from './managers/Workspace';
import { WorkspaceUI } from './managers/WorkspaceUI';
import { MarkdownProcessorRegistry } from './markdown/MarkdownProcessor';
import { PluginManager } from './PluginManager';
import { ShortcutManager } from './ShortcutManager';
import { TabManager } from './TabManager';
import { ThemeManager } from './ThemeManager';
import { loggers } from './utils/logger';

/**
 * Main App class - Central hub for the Inkdown application
 * Manages all core systems and coordinates between them
 */
export class App {
    private logger = loggers.app;

    // Managers
    pluginManager: PluginManager;
    themeManager: ThemeManager;
    communityThemeManager: CommunityThemeManager;
    communityPluginManager: CommunityPluginManager;
    configManager: ConfigManager;
    shortcutManager: ShortcutManager;
    tabManager: TabManager;
    fileSystemManager: FileSystemManager;
    workspace: Workspace;
    workspaceUI: WorkspaceUI;
    fileManager: FileManager;
    filesConfigManager: FilesConfigManager;
    windowConfigManager: WindowConfigManager;
    bookmarkManager: BookmarkManager;
    metadataCache: MetadataCache;
    markdownProcessor: MarkdownProcessorRegistry;
    editorStateManager: EditorStateManager;
    syncManager: SyncManager;
    dialog: DialogManager;

    editorRegistry: EditorRegistry;
    fontManager: FontManager;

    private editorSuggests: EditorSuggest<any>[] = [];

    private initialized = false;

    constructor(builtInPlugins: any[] = []) {
        // Initialize managers
        this.configManager = new ConfigManager();
        this.fileSystemManager = new FileSystemManager();
        this.workspace = new Workspace(this);
        this.workspaceUI = new WorkspaceUI(this);
        this.fileManager = new FileManager(this);
        this.filesConfigManager = new FilesConfigManager(this);
        this.windowConfigManager = new WindowConfigManager(this);
        this.bookmarkManager = new BookmarkManager(this);
        this.metadataCache = new MetadataCache(this);
        this.markdownProcessor = new MarkdownProcessorRegistry();
        this.editorStateManager = new EditorStateManager(this);
        this.editorRegistry = new EditorRegistry();
        this.fontManager = new FontManager();
        this.syncManager = new SyncManager(this);
        this.pluginManager = new PluginManager(this);
        this.themeManager = new ThemeManager(this);
        this.communityThemeManager = new CommunityThemeManager(this);
        this.communityPluginManager = new CommunityPluginManager(this);
        this.shortcutManager = new ShortcutManager(this);
        this.dialog = new DialogManager();
        this.tabManager = new TabManager(this);

        // Set App reference in FileSystemManager for event emission
        this.fileSystemManager.setApp(this);

        // Register built-in plugins
        for (const info of builtInPlugins) {
            this.pluginManager.registerPlugin(info);
        }
    }

    /**
     * Initialize the application
     * Loads configuration, plugins, and theme
     */
    async init(): Promise<void> {
        if (this.initialized) {
            this.logger.warn('App already initialized');
            return;
        }

        this.logger.info('Initializing Inkdown...');

        // Inject Notice styles
        injectNoticeStyles();
        this.logger.debug('Notice styles injected');

        try {
            // 1. Initialize config manager first (needed by other managers)
            await this.configManager.init();
            this.logger.debug('ConfigManager initialized');

            // 2. Load system fonts
            try {
                await this.fontManager.loadSystemFonts();
                this.logger.debug('FontManager initialized');
            } catch (error: any) {
                this.logger.warn('Failed to load system fonts, using fallback', error);
            }

            // 3. Load theme
            await this.loadTheme();

            // 3.5. Initialize community theme manager
            await this.communityThemeManager.init();
            this.logger.debug('CommunityThemeManager initialized');

            // 4. Initialize sync manager
            await this.syncManager.init();
            this.logger.debug('SyncManager initialized');

            // 5. Initialize bookmark manager
            await this.bookmarkManager.initialize();
            this.logger.debug('BookmarkManager initialized');

            // 6. Initialize community plugin manager and load community plugins
            await this.communityPluginManager.init();
            await this.communityPluginManager.loadAllInstalledPlugins();
            this.logger.debug('CommunityPluginManager initialized');

            // 7. Load all plugins (built-in + community)
            await this.loadPlugins();

            // 8. Initialize tab manager and restore tabs
            await this.tabManager.init();
            this.logger.debug('TabManager initialized');

            // 9. Initialize shortcut manager
            await this.shortcutManager.init();
            this.logger.debug('ShortcutManager initialized');

            this.initialized = true;
            this.logger.info('Inkdown initialized successfully');
        } catch (error: any) {
            this.logger.error('Failed to initialize Inkdown', error);
            throw error;
        }
    }

    /**
     * Load all plugins (built-in and custom)
     */
    async loadPlugins(): Promise<void> {
        this.logger.info('Loading plugins...');
        await this.pluginManager.loadAllPlugins();
    }

    /**
     * Load the current theme
     */
    async loadTheme(): Promise<void> {
        this.logger.info('Loading theme...');
        await this.themeManager.init();
    }

    /**
     * Cleanup when app is closing
     */
    async cleanup(): Promise<void> {
        this.logger.info('Cleaning up Inkdown...');

        // Save all dirty files
        await this.editorStateManager.saveAllDirty();

        // Saving here causes a race condition where empty tabs overwrite valid ones during hot reload.
        // await this.tabManager.saveTabs(); // ← REMOVED

        await this.configManager.saveAllConfigs();

        // Unload all plugins
        await this.pluginManager.unloadAllPlugins();

        // Clear editor suggests
        this.editorSuggests = [];

        this.initialized = false;
        this.logger.info('Inkdown cleanup complete');
    }

    /**
     * Register an editor suggest
     */
    registerEditorSuggest(suggest: EditorSuggest<any>): void {
        this.editorSuggests.push(suggest);
    }

    /**
     * Unregister an editor suggest
     */
    unregisterEditorSuggest(suggest: EditorSuggest<any>): void {
        const index = this.editorSuggests.indexOf(suggest);
        if (index > -1) {
            this.editorSuggests.splice(index, 1);
        }
    }

    /**
     * Handle editor updates (cursor change, content change)
     * Called by the editor component
     */
    handleEditorUpdate(update: ViewUpdate): void {
        if (!update.docChanged && !update.selectionSet) return;

        const view = update.view;
        const cursor = view.state.selection.main.head;
        const line = view.state.doc.lineAt(cursor);

        const editorPosition = {
            line: line.number - 1, // 0-indexed
            ch: cursor - line.from,
        };

        // Notify all suggests
        for (const suggest of this.editorSuggests) {
            suggest.onCursorChange(editorPosition, view, null);
        }
    }

    /**
     * Handle keydown events from the editor
     * Routes events to active suggestions
     */
    handleKeyDown(evt: KeyboardEvent): boolean {
        // Check if any suggest is open and wants to handle the key
        for (const suggest of this.editorSuggests) {
            if (suggest.isOpen && suggest.handleKeyDown(evt)) {
                return true;
            }
        }
        return false;
    }

    /**
     * Open an external URL in the default browser
     * Uses Tauri's opener plugin for security
     */
    async openExternalLink(url: string): Promise<void> {
        try {
            // Dynamic import to avoid bundling on web
            const { openUrl } = await import('@tauri-apps/plugin-opener');
            await openUrl(url);
            this.logger.debug(`Opened external link: ${url}`);
        } catch (error: any) {
            this.logger.error('Failed to open external link', error);
            // Fallback for development/web
            if (typeof window !== 'undefined') {
                window.open(url, '_blank');
            }
        }
    }
}
