import type { Range } from '@codemirror/state';
import type { EditorView } from '@codemirror/view';
import { Decoration } from '@codemirror/view';
import { shouldDecorate } from '../utils/selection';

/**
 * Create decorations for headings (# Heading)
 * Hides the # markers when cursor is not on the line
 */
export function createHeadingDecorations(
    view: EditorView,
    from: number,
    to: number,
): Range<Decoration>[] {
    const decorations: Range<Decoration>[] = [];

    if (!shouldDecorate(view, from, to)) {
        return decorations;
    }

    const text = view.state.doc.sliceString(from, to);

    // Match heading markers at start of line: # ## ### etc
    const headingRegex = /^(#{1,6})\s+/;
    const match = headingRegex.exec(text);

    if (match) {
        const matchFrom = from;
        const matchTo = from + match[0].length;

        // Hide the heading markers (# symbols and space)
        decorations.push(Decoration.replace({}).range(matchFrom, matchTo));
    }

    return decorations;
}
