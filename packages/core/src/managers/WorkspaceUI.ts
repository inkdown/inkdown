import type { App } from '../App';
import { type EventRef, Events } from '../Events';
import type { ItemView } from '../views/ItemView';
import type { TFile } from './Workspace';

/**
 * WorkspaceUI - Manages UI state, tabs, views, and layout
 *
 * This class handles the visual workspace (tabs, views, layout) while
 * Workspace handles file operations.
 */
export class WorkspaceUI extends Events {
    private _app: App;

    private _activeFile: TFile | null = null;

    constructor(app: App) {
        super();
        this._app = app;
    }

    /**
     * Get the currently active file
     * @returns The active file or null if no file is open
     */
    getActiveFile(): TFile | null {
        return this._activeFile;
    }

    /**
     * Set the currently active file
     * @internal Called by tab manager/app
     */
    _setActiveFile(file: TFile | null): void {
        const oldFile = this._activeFile;
        this._activeFile = file;

        if (oldFile?.path !== file?.path) {
            this.trigger('active-file-change', file, oldFile);
        }
    }

    /**
     * Open a file in a tab
     * @param file The file to open
     * @param newTab Whether to open in a new tab (default: false)
     */
    async openFile(file: TFile, newTab = false): Promise<void> {
        // Add to recent files
        this._app.workspace.addRecentFile(file.path);

        // Open the file using TabManager
        await this._app.tabManager.openTab(file.path, {
            openInNewTab: newTab,
        });

        // Trigger file-open event
        this.trigger('file-open', file);
    }

    /**
     * Get active view of a specific type
     * This is useful for plugins that want to check if a specific view type is active
     *
     * @example
     * ```ts
     * const markdownView = this.app.workspaceUI.getActiveViewOfType(MarkdownView);
     * if (markdownView) {
     *   // Do something with the markdown view
     * }
     * ```
     */
    private viewRegistry: Map<string, () => ItemView> = new Map();
    private activeView: ItemView | null = null;

    /**
     * Register a new view type
     * @param type The view type identifier
     * @param viewCreator Factory function to create the view
     */
    registerView(type: string, viewCreator: () => ItemView): void {
        this.viewRegistry.set(type, viewCreator);
    }

    /**
     * Get the currently active view
     */
    getActiveView(): ItemView | null {
        return this.activeView;
    }

    /**
     * Get active view of a specific type
     * This is useful for plugins that want to check if a specific view type is active
     *
     * @example
     * ```ts
     * const markdownView = this.app.workspaceUI.getActiveViewOfType(MarkdownView);
     * if (markdownView) {
     *   // Do something with the markdown view
     * }
     * ```
     */
    getActiveViewOfType<T extends ItemView>(viewType: new (...args: any[]) => T): T | null {
        if (this.activeView && this.activeView instanceof viewType) {
            return this.activeView as T;
        }
        return null;
    }

    /**
     * Get the layout root container
     * Useful for plugins that need to manipulate the layout
     */
    getLayoutRoot(): HTMLElement | null {
        // TODO: Implement when we have layout system
        return null;
    }

    /**
     * Register event for when active file changes
     */
    onActiveFileChange(callback: (file: TFile | null) => void): EventRef {
        return this.on('active-file-change', callback);
    }

    /**
     * Register event for when a file is opened
     */
    onFileOpen(callback: (file: TFile) => void): EventRef {
        return this.on('file-open', callback);
    }

    /**
     * Register event for when layout changes
     */
    onLayoutChange(callback: () => void): EventRef {
        return this.on('layout-change', callback);
    }

    /**
     * Trigger active file change event
     * @internal - Called by TabManager when active tab changes
     */
    _onActiveFileChange(file: TFile | null): void {
        this.trigger('active-file-change', file);
    }

    /**
     * Trigger layout change event
     * @internal - Called when layout is modified
     */
    _onLayoutChange(): void {
        this.trigger('layout-change');
    }
}
