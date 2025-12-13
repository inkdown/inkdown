import type { App } from '../App';
import { Component } from '../Component';

/**
 * Base class for all views in Inkdown
 */
export abstract class ItemView extends Component {
    app: App;
    containerEl: HTMLElement;
    contentEl: HTMLElement;

    constructor(app: App) {
        super();
        this.app = app;

        // Create container
        this.containerEl = document.createElement('div');
        this.containerEl.addClass('view-container');

        // Create content area
        this.contentEl = this.containerEl.createDiv('view-content');
    }

    /**
     * Get the view type identifier
     * Must be unique for each view type
     */
    abstract getViewType(): string;

    /**
     * Get the display text for the view (e.g. tab title)
     */
    abstract getDisplayText(): string;

    /**
     * Get the icon for the view
     */
    getIcon(): string {
        return 'document';
    }

    /**
     * Called when the view is opened
     */
    abstract onOpen(): Promise<void> | void;

    /**
     * Called when the view is closed
     */
    async onClose(): Promise<void> {
        // Cleanup container
        this.containerEl.empty();
    }

    /**
     * Called when the view is resized
     */
    onResize(): void {
        // Optional override
    }
}
