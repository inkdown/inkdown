import { EditorView } from '@codemirror/view';

/**
 * Position in the editor (line and column)
 */
export interface EditorPosition {
    /** Line number (0-indexed) */
    line: number;
    /** Column/character position in the line (0-indexed) */
    ch: number;
}

/**
 * Range in the editor (from-to positions)
 */
export interface EditorRange {
    from: EditorPosition;
    to: EditorPosition;
}

/**
 * Editor transaction for making changes
 */
export interface EditorTransaction {
    /** Changes to apply */
    changes?: {
        from: number;
        to?: number;
        insert?: string;
    }[];
    /** New selection after changes */
    selection?: {
        anchor: number;
        head?: number;
    };
}

/**
 * Editor - Abstract interface for editor operations
 *
 * This interface provides a plugin-friendly API for editor operations
 * without exposing CodeMirror internals directly. Plugins should use this
 * interface instead of accessing CodeMirror's EditorView directly.
 *
 * @example
 * ```ts
 * // In a plugin command
 * this.addCommand({
 *   id: 'insert-text',
 *   name: 'Insert Text',
 *   editorCallback: (editor: Editor) => {
 *     const selection = editor.getSelection();
 *     editor.replaceSelection(`**${selection}**`);
 *   }
 * });
 * ```
 */
export interface Editor {
    // ===== Selection Operations =====

    /**
     * Get the currently selected text
     */
    getSelection(): string;

    /**
     * Replace the current selection with new text
     * @param replacement Text to insert
     */
    replaceSelection(replacement: string): void;

    /**
     * Get text in a specific range
     * @param from Start position
     * @param to End position
     */
    getRange(from: EditorPosition, to: EditorPosition): string;

    /**
     * Replace text in a specific range
     * @param replacement Text to insert
     * @param from Start position
     * @param to End position (optional, defaults to from)
     */
    replaceRange(replacement: string, from: EditorPosition, to?: EditorPosition): void;

    // ===== Cursor Operations =====

    /**
     * Get cursor position
     * @param type Which end of the selection ('from', 'to', 'head', 'anchor')
     */
    getCursor(type?: 'from' | 'to' | 'head' | 'anchor'): EditorPosition;

    /**
     * Set cursor position
     * @param pos Position to set cursor to
     */
    setCursor(pos: EditorPosition | number): void;

    /**
     * Set selection range
     * @param anchor Start of selection
     * @param head End of selection (optional, defaults to anchor)
     */
    setSelection(anchor: EditorPosition | number, head?: EditorPosition | number): void;

    // ===== Content Operations =====

    /**
     * Get the entire editor content
     */
    getValue(): string;

    /**
     * Set the entire editor content
     * @param content New content
     */
    setValue(content: string): void;

    /**
     * Get a specific line's content
     * @param line Line number (0-indexed)
     */
    getLine(line: number): string;

    /**
     * Get total number of lines
     */
    lineCount(): number;

    /**
     * Get the last line number
     */
    lastLine(): number;

    /**
     * Get the offset (character position) from a line/ch position
     * @param pos Position to convert
     */
    posToOffset(pos: EditorPosition): number;

    /**
     * Get the line/ch position from an offset
     * @param offset Character offset
     */
    offsetToPos(offset: number): EditorPosition;

    // ===== Transaction Operations =====

    /**
     * Execute a transaction (batch of changes)
     * @param tx Transaction to execute
     */
    transaction(tx: EditorTransaction): void;

    // ===== View Operations =====

    /**
     * Scroll a range into view
     * @param range Range to scroll to
     */
    scrollIntoView(range?: EditorRange): void;

    /**
     * Focus the editor
     */
    focus(): void;

    /**
     * Check if editor has focus
     */
    hasFocus(): boolean;

    // ===== Advanced: CodeMirror Access =====

    /**
     * Get the underlying CodeMirror EditorView
     * Use this only when the abstraction is insufficient
     * @internal
     */
    cm: EditorView;
}

/**
 * EditorAdapter - Wraps CodeMirror EditorView to implement Editor interface
 *
 * This adapter provides the bridge between CodeMirror and our plugin API.
 * @internal
 */
export class EditorAdapter implements Editor {
    cm: EditorView;

    constructor(view: EditorView) {
        this.cm = view;
    }

    // ===== Selection Operations =====

    getSelection(): string {
        const selection = this.cm.state.selection.main;
        return this.cm.state.sliceDoc(selection.from, selection.to);
    }

    replaceSelection(replacement: string): void {
        const selection = this.cm.state.selection.main;
        this.cm.dispatch({
            changes: { from: selection.from, to: selection.to, insert: replacement },
            selection: { anchor: selection.from + replacement.length },
        });
    }

    getRange(from: EditorPosition, to: EditorPosition): string {
        const fromOffset = this.posToOffset(from);
        const toOffset = this.posToOffset(to);
        return this.cm.state.sliceDoc(fromOffset, toOffset);
    }

    replaceRange(replacement: string, from: EditorPosition, to?: EditorPosition): void {
        const fromOffset = this.posToOffset(from);
        const toOffset = to ? this.posToOffset(to) : fromOffset;
        this.cm.dispatch({
            changes: { from: fromOffset, to: toOffset, insert: replacement },
        });
    }

    // ===== Cursor Operations =====

    getCursor(type: 'from' | 'to' | 'head' | 'anchor' = 'head'): EditorPosition {
        const selection = this.cm.state.selection.main;
        let offset: number;

        switch (type) {
            case 'from':
                offset = selection.from;
                break;
            case 'to':
                offset = selection.to;
                break;
            case 'anchor':
                offset = selection.anchor;
                break;
            default:
                offset = selection.head;
                break;
        }

        return this.offsetToPos(offset);
    }

    setCursor(pos: EditorPosition | number): void {
        const offset = typeof pos === 'number' ? pos : this.posToOffset(pos);
        this.cm.dispatch({
            selection: { anchor: offset, head: offset },
        });
    }

    setSelection(anchor: EditorPosition | number, head?: EditorPosition | number): void {
        const anchorOffset = typeof anchor === 'number' ? anchor : this.posToOffset(anchor);
        const headOffset =
            head !== undefined
                ? typeof head === 'number'
                    ? head
                    : this.posToOffset(head)
                : anchorOffset;

        this.cm.dispatch({
            selection: { anchor: anchorOffset, head: headOffset },
        });
    }

    // ===== Content Operations =====

    getValue(): string {
        return this.cm.state.doc.toString();
    }

    setValue(content: string): void {
        this.cm.dispatch({
            changes: { from: 0, to: this.cm.state.doc.length, insert: content },
        });
    }

    getLine(line: number): string {
        const lineObj = this.cm.state.doc.line(line + 1); // CodeMirror lines are 1-indexed
        return lineObj.text;
    }

    lineCount(): number {
        return this.cm.state.doc.lines;
    }

    lastLine(): number {
        return this.cm.state.doc.lines - 1;
    }

    posToOffset(pos: EditorPosition): number {
        const line = this.cm.state.doc.line(pos.line + 1); // CodeMirror lines are 1-indexed
        return line.from + pos.ch;
    }

    offsetToPos(offset: number): EditorPosition {
        const line = this.cm.state.doc.lineAt(offset);
        return {
            line: line.number - 1, // Convert to 0-indexed
            ch: offset - line.from,
        };
    }

    // ===== Transaction Operations =====

    transaction(tx: EditorTransaction): void {
        this.cm.dispatch(tx as any);
    }

    // ===== View Operations =====

    scrollIntoView(range?: EditorRange): void {
        if (range) {
            const from = this.posToOffset(range.from);
            this.cm.dispatch({
                effects: EditorView.scrollIntoView(from, { y: 'center' }),
            });
        } else {
            const selection = this.cm.state.selection.main;
            this.cm.dispatch({
                effects: EditorView.scrollIntoView(selection.head, { y: 'center' }),
            });
        }
    }

    focus(): void {
        this.cm.focus();
    }

    hasFocus(): boolean {
        return this.cm.hasFocus;
    }
}
