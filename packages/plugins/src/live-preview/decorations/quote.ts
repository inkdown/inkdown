import type { Range } from '@codemirror/state';
import type { EditorView } from '@codemirror/view';
import { Decoration } from '@codemirror/view';
import { shouldDecorate } from '../utils/selection';

/**
 * Create decorations for blockquotes (> text)
 * Hides the > marker when cursor is not on the line
 */
export function createQuoteDecorations(
    view: EditorView,
    from: number,
    to: number,
): Range<Decoration>[] {
    const decorations: Range<Decoration>[] = [];

    if (!shouldDecorate(view, from, to)) {
        return decorations;
    }

    const text = view.state.doc.sliceString(from, to);

    // Match quote marker at start of line: > or >>
    const quoteRegex = /^(>\s*)+/;
    const match = quoteRegex.exec(text);

    if (match) {
        const matchFrom = from;
        const matchTo = from + match[0].length;

        // Hide the quote markers
        decorations.push(Decoration.replace({}).range(matchFrom, matchTo));
    }

    return decorations;
}
