import type { Range } from '@codemirror/state';
import type { EditorView } from '@codemirror/view';
import { Decoration } from '@codemirror/view';
import { shouldDecorate } from '../utils/selection';

/**
 * Create decorations for bold text (**text** or __text__)
 * Hides the markers and applies bold styling
 */
export function createBoldDecorations(
    view: EditorView,
    from: number,
    to: number,
): Range<Decoration>[] {
    const decorations: Range<Decoration>[] = [];

    if (!shouldDecorate(view, from, to)) {
        return decorations;
    }

    const text = view.state.doc.sliceString(from, to);

    // Match **text** or __text__
    const boldRegex = /(\*\*|__)(.+?)\1/g;
    let match;

    while ((match = boldRegex.exec(text)) !== null) {
        const matchFrom = from + match.index;
        const matchTo = matchFrom + match[0].length;
        const markerLen = match[1].length; // 2 for ** or __

        // Hide opening markers
        decorations.push(Decoration.replace({}).range(matchFrom, matchFrom + markerLen));

        // Hide closing markers
        decorations.push(Decoration.replace({}).range(matchTo - markerLen, matchTo));

        // Apply bold styling to content
        decorations.push(
            Decoration.mark({
                class: 'cm-strong',
                attributes: { style: 'font-weight: bold;' },
            }).range(matchFrom + markerLen, matchTo - markerLen),
        );
    }

    return decorations;
}
