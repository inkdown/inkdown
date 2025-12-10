import type { Range } from '@codemirror/state';
import type { EditorView } from '@codemirror/view';
import { Decoration } from '@codemirror/view';
import { shouldDecorate } from '../utils/selection';

/**
 * Create decorations for strikethrough text (~~text~~)
 * Hides the markers and applies strikethrough styling
 */
export function createStrikethroughDecorations(
    view: EditorView,
    from: number,
    to: number,
): Range<Decoration>[] {
    const decorations: Range<Decoration>[] = [];

    if (!shouldDecorate(view, from, to)) {
        return decorations;
    }

    const text = view.state.doc.sliceString(from, to);

    // Match ~~text~~
    const strikeRegex = /(~~)(.+?)\1/g;
    let match;

    match = strikeRegex.exec(text);
    while (match !== null) {
        const matchFrom = from + match.index;
        const matchTo = matchFrom + match[0].length;
        const markerLen = 2; // ~~

        // Hide opening markers
        decorations.push(Decoration.replace({}).range(matchFrom, matchFrom + markerLen));

        // Hide closing markers
        decorations.push(Decoration.replace({}).range(matchTo - markerLen, matchTo));

        // Apply strikethrough styling to content
        decorations.push(
            Decoration.mark({
                class: 'cm-strikethrough',
                attributes: { style: 'text-decoration: line-through;' },
            }).range(matchFrom + markerLen, matchTo - markerLen),
        );
        match = strikeRegex.exec(text);
    }

    return decorations;
}
