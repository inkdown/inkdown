import type { Range } from '@codemirror/state';
import type { EditorView } from '@codemirror/view';
import { Decoration } from '@codemirror/view';
import { shouldDecorate } from '../utils/selection';

/**
 * Create decorations for horizontal rules (---, ***, ___)
 * Replaces the text with a styled horizontal line
 */
export function createHrDecorations(
    view: EditorView,
    from: number,
    to: number,
): Range<Decoration>[] {
    const decorations: Range<Decoration>[] = [];

    if (!shouldDecorate(view, from, to)) {
        return decorations;
    }

    const text = view.state.doc.sliceString(from, to);

    // Match horizontal rules: 3 or more -, *, or _ on a line by themselves
    // Note: We check the whole line content in the loop, but regex here helps identify
    const hrRegex = /^(\s{0,3})([-*_])\s*(\2\s*){2,}$/;

    if (hrRegex.test(text)) {
        // Replace the entire line with a horizontal rule widget or styling
        // Using a line decoration with a class that styles it as a line
        // and hides the text
        decorations.push(
            Decoration.replace({
                widget: new HrWidget(),
                block: false, // Inline replacement of text
            }).range(from, to),
        );
    }

    return decorations;
}

import { WidgetType } from '@codemirror/view';

class HrWidget extends WidgetType {
    toDOM() {
        const hr = document.createElement('hr');
        hr.className = 'cm-hr';
        return hr;
    }
}
