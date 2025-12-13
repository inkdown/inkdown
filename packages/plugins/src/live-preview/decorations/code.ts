import type { Range } from '@codemirror/state';
import type { EditorView } from '@codemirror/view';
import { Decoration } from '@codemirror/view';
import { shouldDecorate } from '../utils/selection';

/**
 * Create decorations for inline code (`code`)
 * Hides the backticks when cursor is not inside
 */
export function createCodeDecorations(
    view: EditorView,
    from: number,
    to: number,
): Range<Decoration>[] {
    const decorations: Range<Decoration>[] = [];

    if (!shouldDecorate(view, from, to)) {
        return decorations;
    }

    const text = view.state.doc.sliceString(from, to);

    // Match `code` but not ```code blocks```
    const codeRegex = /(?<!`)`(?!`)(.+?)`(?!`)/g;
    let match;

    match = codeRegex.exec(text);
    while (match !== null) {
        const matchFrom = from + match.index;
        const matchTo = matchFrom + match[0].length;

        // Hide opening backtick
        decorations.push(Decoration.replace({}).range(matchFrom, matchFrom + 1));

        // Hide closing backtick
        decorations.push(Decoration.replace({}).range(matchTo - 1, matchTo));

        // The code styling is already applied by CodeMirror's syntax highlighting
        // We just hide the backticks
        match = codeRegex.exec(text);
    }

    return decorations;
}
