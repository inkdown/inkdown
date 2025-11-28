import type { Line } from '@codemirror/state';
import type { EditorView } from '@codemirror/view';

/**
 * Iterate only over visible lines in the viewport
 * This is a performance optimization to avoid processing off-screen content
 */
export function iterateVisibleLines(
    view: EditorView,
    callback: (line: Line, lineNumber: number) => void,
): void {
    for (const { from, to } of view.visibleRanges) {
        let pos = from;
        while (pos <= to) {
            const line = view.state.doc.lineAt(pos);
            callback(line, line.number);
            pos = line.to + 1;
        }
    }
}

/**
 * Check if a position is within the visible viewport
 */
export function isInViewport(view: EditorView, pos: number): boolean {
    for (const { from, to } of view.visibleRanges) {
        if (pos >= from && pos <= to) {
            return true;
        }
    }
    return false;
}
