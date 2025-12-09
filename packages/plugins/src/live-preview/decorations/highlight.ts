import type { Range } from '@codemirror/state';
import type { EditorView } from '@codemirror/view';
import { Decoration } from '@codemirror/view';
import { shouldDecorate } from '../utils/selection';

/**
 * Create decorations for highlighted text (==text==)
 * Hides the markers and applies highlight background styling
 */
export function createHighlightDecorations(
    view: EditorView,
    from: number,
    to: number,
): Range<Decoration>[] {
    const decorations: Range<Decoration>[] = [];

    if (!shouldDecorate(view, from, to)) {
        return decorations;
    }

    const text = view.state.doc.sliceString(from, to);

    // Match ==text==
    const highlightRegex = /(==)(.+?)\1/g;
    let match;

    while ((match = highlightRegex.exec(text)) !== null) {
        const matchFrom = from + match.index;
        const matchTo = matchFrom + match[0].length;
        const markerLen = match[1].length; // 2 for ==

        // Hide opening markers
        decorations.push(Decoration.replace({}).range(matchFrom, matchFrom + markerLen));

        // Hide closing markers
        decorations.push(Decoration.replace({}).range(matchTo - markerLen, matchTo));

        // Apply highlight styling to content
        decorations.push(
            Decoration.mark({
                class: 'cm-highlight',
            }).range(matchFrom + markerLen, matchTo - markerLen),
        );
    }

    return decorations;
}
