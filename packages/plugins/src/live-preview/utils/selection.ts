import type { SelectionRange } from '@codemirror/state';
import type { EditorView } from '@codemirror/view';

/**
 * Check if the current selection intersects with a given range
 * Used to determine if we should hide decorations (show raw markdown)
 */
export function intersectsSelection(selection: SelectionRange, from: number, to: number): boolean {
    return selection.from <= to && selection.to >= from;
}

/**
 * Check if we should apply decorations to a range
 * Returns false if the cursor is inside the range (show raw markdown)
 */
export function shouldDecorate(view: EditorView, from: number, to: number): boolean {
    const selection = view.state.selection.main;
    return !intersectsSelection(selection, from, to);
}

/**
 * Check if cursor is at the start or end of a range
 * Useful for showing markers when cursor is adjacent
 */
export function isCursorAdjacent(view: EditorView, from: number, to: number): boolean {
    const selection = view.state.selection.main;
    return selection.from === from || selection.from === to;
}
