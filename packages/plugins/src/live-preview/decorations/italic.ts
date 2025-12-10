import type { Range } from '@codemirror/state';
import type { EditorView } from '@codemirror/view';
import { Decoration } from '@codemirror/view';
import { shouldDecorate } from '../utils/selection';

/**
 * Create decorations for italic text (*text* or _text_)
 * Hides the markers and applies italic styling
 * Careful to avoid matching bold (**text**)
 */
export function createItalicDecorations(
    view: EditorView,
    from: number,
    to: number,
): Range<Decoration>[] {
    const decorations: Range<Decoration>[] = [];

    if (!shouldDecorate(view, from, to)) {
        return decorations;
    }

    const text = view.state.doc.sliceString(from, to);

    // Match *text* or _text_ but not **text**
    // Negative lookbehind/lookahead to avoid bold markers
    const italicRegex = /(?<!\*)(\*|_)(?!\1)(.+?)\1(?!\1)/g;
    let match;

    match = italicRegex.exec(text);
    while (match !== null) {
        const matchFrom = from + match.index;
        const matchTo = matchFrom + match[0].length;

        // Hide opening marker
        decorations.push(Decoration.replace({}).range(matchFrom, matchFrom + 1));

        // Hide closing marker
        decorations.push(Decoration.replace({}).range(matchTo - 1, matchTo));

        // Apply italic styling to content
        decorations.push(
            Decoration.mark({
                class: 'cm-em',
                attributes: { style: 'font-style: italic;' },
            }).range(matchFrom + 1, matchTo - 1),
        );
        match = italicRegex.exec(text);
    }

    return decorations;
}
