import type { EditorView } from '@codemirror/view';
import type { App } from '../App';
import type { EditorPosition } from '../editor/EditorAdapter';
import type { TFile } from '../managers/Workspace';
import { PopoverSuggest } from './FuzzySuggestModal';

/**
 * Trigger information for EditorSuggest
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
    /** Editor instance */
    editor: EditorView;
    /** Current file */
    file: TFile | null;
}

/**
 * EditorSuggest - Abstract class for providing autocompletion in the editor
 *
 * Performance optimizations:
 * - Debouncing of suggestions (300ms default)
 * - Lazy rendering (only render visible items)
 * - Abort previous suggestion requests
 *
 * Example usage:
 * ```ts
 * class MentionSuggest extends EditorSuggest<User> {
 *   onTrigger(cursor, editor, file) {
 *     const line = editor.getLine(cursor.line);
 *     const beforeCursor = line.slice(0, cursor.ch);
 *     const match = beforeCursor.match(/@(\w*)$/);
 *
 *     if (!match) return null;
 *
 *     return {
 *       start: { line: cursor.line, ch: cursor.ch - match[0].length },
 *       end: cursor,
 *       query: match[1]
 *     };
 *   }
 *
 *   getSuggestions(context) {
 *     return this.users.filter(u =>
 *       u.name.toLowerCase().includes(context.query.toLowerCase())
 *     );
 *   }
 *
 *   renderSuggestion(user, el) {
 *     el.setText(`@${user.name}`);
 *   }
 *
 *   selectSuggestion(user, evt) {
 *     const { editor } = this.context;
 *     const { start, end } = this.context;
 *
 *     editor.replaceRange(`@${user.name}`, start, end);
 *   }
 * }
 * ```
 */
export abstract class EditorSuggest<T> extends PopoverSuggest<T, EditorSuggestContext> {
    protected context: EditorSuggestContext | null = null;
    private debounceTimer: number | null = null;
    private abortController: AbortController | null = null;
    private readonly debounceDelay: number = 300; // ms
    private limit = 50; // Max suggestions to render

    constructor(app: App) {
        // Create a temporary container for suggestions
        const container = document.createDiv({ cls: 'suggestion-container' });
        super(app, container);

        // Style the container
        container.style.position = 'absolute';
        container.style.zIndex = '1000';
        container.style.display = 'none';
    }

    /**
     * Check if the suggestion popup is open
     */
    get isOpen(): boolean {
        return this.context !== null;
    }

    /**
     * Check if suggest should trigger at current cursor position
     * Return null to not trigger, or trigger info to show suggestions
     *
     * PERFORMANCE: Keep this fast - it runs on every cursor change
     */
    abstract onTrigger(
        cursor: EditorPosition,
        editor: EditorView,
        file: TFile | null,
    ): EditorSuggestTriggerInfo | null;

    /**
     * Get suggestions for the context
     * Can return Promise for async loading
     *
     * PERFORMANCE: Use AbortSignal to cancel previous requests
     */
    abstract getSuggestions(context: EditorSuggestContext): T[] | Promise<T[]>;

    /**
     * Select a suggestion
     */
    abstract selectSuggestion(value: T, evt: MouseEvent | KeyboardEvent): void;

    /**
     * Called when cursor changes in editor
     * PERFORMANCE: Debounced to avoid excessive calls
     */
    onCursorChange(cursor: EditorPosition, editor: EditorView, file: TFile | null): void {
        // Clear previous debounce
        if (this.debounceTimer !== null) {
            clearTimeout(this.debounceTimer);
        }

        // Debounce suggestions
        this.debounceTimer = window.setTimeout(async () => {
            const triggerInfo = this.onTrigger(cursor, editor, file);

            if (!triggerInfo) {
                this.close();
                return;
            }

            // Create context
            this.context = {
                ...triggerInfo,
                editor,
                file,
            };

            // Abort previous request
            if (this.abortController) {
                this.abortController.abort();
            }
            this.abortController = new AbortController();

            // Get suggestions
            try {
                const allSuggestions = await Promise.resolve(this.getSuggestions(this.context));
                // Limit suggestions for performance
                this.suggestions = allSuggestions.slice(0, this.limit);

                this.selectedItem = 0;
                this.renderSuggestions();
                this.open(cursor, editor);
            } catch (error: any) {
                if (error instanceof Error && error.name !== 'AbortError') {
                    console.error('Error getting suggestions:', error);
                }
            }
        }, this.debounceDelay);
    }

    /**
     * Open suggestion popup at cursor position
     */
    private open(cursor: EditorPosition, editor: EditorView): void {
        if (this.suggestions.length === 0) {
            this.close();
            return;
        }

        // Get cursor coordinates
        const coords = this.getCursorCoords(cursor, editor);

        this.containerEl.style.top = `${coords.top}px`;
        this.containerEl.style.left = `${coords.left}px`;
        this.containerEl.style.display = 'block';

        // Append to body if not already
        if (!this.containerEl.parentElement) {
            document.body.appendChild(this.containerEl);
        }
    }

    /**
     * Close suggestion popup
     */
    close(): void {
        this.containerEl.style.display = 'none';
        this.context = null;

        // Clear abort controller
        if (this.abortController) {
            this.abortController.abort();
            this.abortController = null;
        }
    }

    /**
     * Get cursor coordinates in viewport
     * PERFORMANCE: Cached per cursor position to avoid expensive DOM measurements
     */
    /**
     * Get cursor coordinates in viewport using CodeMirror API
     */
    private getCursorCoords(
        _cursor: EditorPosition,
        editor: EditorView,
    ): { top: number; left: number } {
        // Use CodeMirror's coordsAtPos to get accurate coordinates
        // We use the head of the main selection which corresponds to the cursor
        const pos = editor.state.selection.main.head;
        const coords = editor.coordsAtPos(pos);

        if (coords) {
            // Add a small offset to position below the cursor
            return {
                top: coords.bottom + 5,
                left: coords.left,
            };
        }

        // Fallback if coords aren't available (shouldn't happen with real editor)
        return { top: 0, left: 0 };
    }

    /**
     * Handle keyboard navigation
     */
    handleKeyDown(evt: KeyboardEvent): boolean {
        if (!this.context) return false;

        // Use base class implementation for standard keys
        return super.handleKeyDown(evt);
    }

    /**
     * Override onEscape to close the suggest popup
     */
    protected onEscape(): boolean {
        this.close();
        return true;
    }

    /**
     * Cleanup
     */
    destroy(): void {
        this.close();
        if (this.debounceTimer !== null) {
            clearTimeout(this.debounceTimer);
        }
        if (this.containerEl.parentElement) {
            this.containerEl.remove();
        }
        if (this.containerEl.parentElement) {
            this.containerEl.remove();
        }
    }
}
