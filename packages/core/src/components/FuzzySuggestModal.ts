import type { App } from '../App';
import { Modal } from './Modal';

/**
 * Search result with match information
 */
export interface SearchMatch {
    /** Matched indices for highlighting */
    matches: number[][];
    /** Match score (higher is better) */
    score: number;
}

/**
 * Fuzzy match result combining item with match info
 */
export interface FuzzyMatch<T> {
    /** The matched item */
    item: T;
    /** Match information */
    match: SearchMatch;
}

/**
 * Base class for popover suggest components
 * Used by FuzzySuggestModal and EditorSuggest
 */
export abstract class PopoverSuggest<T, TContext = string> {
    protected app: App;
    public containerEl: HTMLElement;
    protected suggestionEls: HTMLElement[] = [];
    protected selectedItem = 0;
    protected suggestions: T[] = [];
    protected useKeyboard = false;

    constructor(app: App, containerEl: HTMLElement) {
        this.app = app;
        this.containerEl = containerEl;
    }

    /**
     * Get suggestions for the current query
     */
    abstract getSuggestions(context: TContext): T[] | Promise<T[]>;

    /**
     * Render a single suggestion item
     */
    abstract renderSuggestion(value: T, el: HTMLElement): void;

    /**
     * Select a suggestion
     */
    abstract selectSuggestion(value: T, evt: MouseEvent | KeyboardEvent): void;

    /**
     * Update suggestions display
     */
    async updateSuggestions(context: TContext): Promise<void> {
        this.suggestions = await Promise.resolve(this.getSuggestions(context));
        this.selectedItem = 0;
        this.renderSuggestions();
    }

    /**
     * Render all suggestions
     */
    protected renderSuggestions(): void {
        this.containerEl.empty();
        this.suggestionEls = [];

        if (this.suggestions.length === 0) {
            const emptyEl = this.containerEl.createDiv({
                cls: 'suggestion-empty',
                text: 'No results found',
            });
            emptyEl.style.padding = '8px 12px';
            emptyEl.style.color = 'var(--text-muted)';
            return;
        }

        this.suggestions.forEach((suggestion, index) => {
            const suggestionEl = this.containerEl.createDiv({
                cls: 'suggestion-item',
            });

            if (index === this.selectedItem) {
                suggestionEl.addClass('is-selected');
            }

            this.renderSuggestion(suggestion, suggestionEl);

            suggestionEl.addEventListener('click', (evt) => {
                this.selectSuggestion(suggestion, evt);
            });

            suggestionEl.addEventListener('mouseenter', () => {
                this.useKeyboard = false;
                this.setSelectedItem(index, false);
            });

            this.suggestionEls.push(suggestionEl);
        });
    }

    /**
     * Set the selected item
     */
    protected setSelectedItem(index: number, scroll = true): void {
        // Remove previous selection
        const prevEl = this.suggestionEls[this.selectedItem];
        if (prevEl) {
            prevEl.removeClass('is-selected');
            prevEl.removeClass('is-keyboard-selected');
        }

        // Set new selection
        this.selectedItem = index;
        const newSelected = this.suggestionEls[this.selectedItem];
        if (newSelected) {
            newSelected.addClass('is-selected');

            // Add keyboard-specific class if navigating via keyboard
            if (this.useKeyboard) {
                newSelected.addClass('is-keyboard-selected');
            }
        }

        if (scroll && newSelected) {
            newSelected.scrollIntoView({
                block: 'nearest',
                behavior: 'smooth',
            });
        }
    }

    /**
     * Navigate to next suggestion
     */
    protected selectNext(): void {
        const newIndex = (this.selectedItem + 1) % this.suggestions.length;
        this.setSelectedItem(newIndex);
    }

    /**
     * Navigate to previous suggestion
     */
    protected selectPrevious(): void {
        const newIndex =
            (this.selectedItem - 1 + this.suggestions.length) % this.suggestions.length;
        this.setSelectedItem(newIndex);
    }

    /**
     * Select the current item
     */
    protected selectCurrent(evt: KeyboardEvent): void {
        const current = this.suggestions[this.selectedItem];
        if (current) {
            this.selectSuggestion(current, evt);
        }
    }

    /**
     * Handle keyboard navigation
     * Standard keyboard shortcuts for all popover suggests:
     * - ArrowDown: Select next item
     * - ArrowUp: Select previous item
     * - Enter: Confirm selection
     * - Escape: Close/cancel (subclass responsibility)
     */
    handleKeyDown(evt: KeyboardEvent): boolean {
        if (this.suggestions.length === 0) return false;

        if (evt.key === 'ArrowDown') {
            evt.preventDefault();
            this.useKeyboard = true;
            this.selectNext();
            return true;
        }
        if (evt.key === 'ArrowUp') {
            evt.preventDefault();
            this.useKeyboard = true;
            this.selectPrevious();
            return true;
        }
        if (evt.key === 'Enter') {
            evt.preventDefault();
            this.selectCurrent(evt);
            return true;
        }
        if (evt.key === 'Escape') {
            evt.preventDefault();
            return this.onEscape();
        }

        return false;
    }

    /**
     * Called when Escape is pressed
     * Subclasses can override to handle close behavior
     */
    protected onEscape(): boolean {
        return false;
    }
}

/**
 * FuzzySuggestModal - Modal with fuzzy search
 *
 * Example usage:
 * ```ts
 * class FileSearchModal extends FuzzySuggestModal<TFile> {
 *   getItems(): TFile[] {
 *     return this.app.workspace.getAllFiles();
 *   }
 *
 *   getItemText(file: TFile): string {
 *     return file.path;
 *   }
 *
 *   onChooseItem(file: TFile, evt: MouseEvent | KeyboardEvent): void {
 *     this.app.workspace.openFile(file);
 *   }
 * }
 * ```
 */
export abstract class FuzzySuggestModal<T> extends Modal {
    private inputEl!: HTMLInputElement;
    private resultsEl: HTMLElement;
    private suggest: PopoverSuggestImpl<T>;
    private limit = 100;

    constructor(app: App) {
        super(app);
        this.containerEl.addClass('fuzzy-suggest-modal');

        // Create suggest implementation
        this.resultsEl = document.createDiv();
        this.suggest = new PopoverSuggestImpl(
            app,
            this.resultsEl,
            (value, el) => this.renderSuggestion(value, el),
            (value, evt) => {
                this.onChooseItem(value.item, evt);
                this.close();
            },
        );
    }

    /**
     * Get all items to search through
     */
    abstract getItems(): Promise<T[]>;

    /**
     * Get the text to search for in an item
     */
    abstract getItemText(item: T): string;

    /**
     * Called when user selects an item
     */
    abstract onChooseItem(item: T, evt: MouseEvent | KeyboardEvent): void;

    /**
     * Render a suggestion (override to customize)
     */
    renderSuggestion(value: FuzzyMatch<T>, el: HTMLElement): void {
        const text = this.getItemText(value.item);
        el.setText(text);
    }

    /**
     * Set the maximum number of results
     */
    setLimit(limit: number): this {
        this.limit = limit;
        return this;
    }

    onOpen(): void {
        const { contentEl } = this;
        contentEl.empty();

        // Search input
        const inputContainer = contentEl.createDiv({ cls: 'fuzzy-suggest-input-container' });
        this.inputEl = inputContainer.createEl('input', {
            type: 'text',
            placeholder: 'Type to search...',
            cls: 'fuzzy-suggest-input',
        });

        // Results container
        this.resultsEl = contentEl.createDiv({ cls: 'fuzzy-suggest-results' });
        this.suggest.containerEl = this.resultsEl;

        // Input event
        this.inputEl.addEventListener('input', () => {
            this.updateSuggestions();
        });

        // Keyboard navigation
        this.inputEl.addEventListener('keydown', (evt) => {
            this.suggest.handleKeyDown(evt);
        });

        // Focus input
        this.inputEl.focus();

        // Initial suggestions
        this.updateSuggestions();
    }

    private async updateSuggestions(): Promise<void> {
        const query = this.inputEl.value;
        const items = await this.getItems();

        // Perform fuzzy search
        const matches: FuzzyMatch<T>[] = [];

        for (const item of items) {
            const text = this.getItemText(item);
            const match = fuzzySearch(query, text);

            if (match.score > 0 || query === '') {
                matches.push({ item, match });
            }
        }

        // Sort by score
        matches.sort((a, b) => b.match.score - a.match.score);

        // Limit results
        const limited = matches.slice(0, this.limit);

        await this.suggest.setSuggestions(limited);
    }

    onClose(): void {
        this.contentEl.empty();
    }
}

/**
 * Internal implementation of PopoverSuggest for FuzzySuggestModal
 */
class PopoverSuggestImpl<T> extends PopoverSuggest<FuzzyMatch<T>, string> {
    private renderCallback: (value: FuzzyMatch<T>, el: HTMLElement) => void;
    private selectCallback: (value: FuzzyMatch<T>, evt: MouseEvent | KeyboardEvent) => void;

    constructor(
        app: App,
        containerEl: HTMLElement,
        renderCallback: (value: FuzzyMatch<T>, el: HTMLElement) => void,
        selectCallback: (value: FuzzyMatch<T>, evt: MouseEvent | KeyboardEvent) => void,
    ) {
        super(app, containerEl);
        this.renderCallback = renderCallback;
        this.selectCallback = selectCallback;
    }

    getSuggestions(_query: string): FuzzyMatch<T>[] {
        return this.suggestions;
    }

    async setSuggestions(suggestions: FuzzyMatch<T>[]): Promise<void> {
        this.suggestions = suggestions;
        this.selectedItem = 0;
        this.renderSuggestions();
    }

    renderSuggestion(value: FuzzyMatch<T>, el: HTMLElement): void {
        this.renderCallback(value, el);
    }

    selectSuggestion(value: FuzzyMatch<T>, evt: MouseEvent | KeyboardEvent): void {
        this.selectCallback(value, evt);
    }

    // Expose navigation methods for modal
    selectNext(): void {
        super.selectNext();
    }

    selectPrevious(): void {
        super.selectPrevious();
    }

    selectCurrent(evt: KeyboardEvent): void {
        super.selectCurrent(evt);
    }
}

/**
 * Simple fuzzy search implementation
 */
function fuzzySearch(query: string, text: string): SearchMatch {
    if (!query) {
        return { matches: [], score: 1 };
    }

    const lowerQuery = query.toLowerCase();
    const lowerText = text.toLowerCase();

    // Check if all query characters are present in order
    let queryIndex = 0;
    let textIndex = 0;
    const matches: number[][] = [];
    let currentMatch: number[] = [];

    while (textIndex < lowerText.length && queryIndex < lowerQuery.length) {
        if (lowerText[textIndex] === lowerQuery[queryIndex]) {
            currentMatch.push(textIndex);
            queryIndex++;

            if (queryIndex === lowerQuery.length) {
                matches.push(currentMatch);
            }
        } else if (currentMatch.length > 0) {
            currentMatch = [];
        }
        textIndex++;
    }

    // Not all query characters found
    if (queryIndex < lowerQuery.length) {
        return { matches: [], score: 0 };
    }

    // Score based on match density
    const matchLength = currentMatch.length;
    const score = matchLength > 0 ? (matchLength / text.length) * 100 : 0;

    return { matches, score };
}

export default FuzzySuggestModal;
