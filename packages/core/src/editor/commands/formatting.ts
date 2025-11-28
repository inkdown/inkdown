/**
 * Text formatting commands (bold, italic, code, etc.)
 */

import type { EditorView } from '@codemirror/view';
import { wrapSelection } from './utils';

/**
 * Toggle bold formatting on selection
 * Wraps with ** or removes existing **
 */
export function toggleBold(view: EditorView): boolean {
    return wrapSelection(view, '**', '**');
}

/**
 * Toggle italic formatting on selection
 * Wraps with * or removes existing *
 */
export function toggleItalic(view: EditorView): boolean {
    return wrapSelection(view, '*', '*');
}

/**
 * Toggle strikethrough formatting on selection
 * Wraps with ~~ or removes existing ~~
 */
export function toggleStrikethrough(view: EditorView): boolean {
    return wrapSelection(view, '~~', '~~');
}

/**
 * Toggle inline code formatting on selection
 * Wraps with ` or removes existing `
 */
export function toggleInlineCode(view: EditorView): boolean {
    return wrapSelection(view, '`', '`');
}

/**
 * Toggle highlight/mark formatting on selection
 * Wraps with == or removes existing ==
 */
export function toggleHighlight(view: EditorView): boolean {
    return wrapSelection(view, '==', '==');
}

/**
 * Insert a link at the current position
 * If text is selected:
 *   - If it's a URL, wraps as [](url)
 *   - Otherwise, wraps as [text](url) with cursor on 'url'
 */
export function insertLink(view: EditorView): boolean {
    const { from, to } = view.state.selection.main;
    const selectedText = view.state.sliceDoc(from, to);

    // Check if selected text is a URL
    const isUrl = /^https?:\/\//.test(selectedText);

    let link: string;
    let cursorPos: number;
    let selectionLength: number;

    if (isUrl) {
        link = '[](' + selectedText + ')';
        cursorPos = from + 1; // Position inside []
        selectionLength = 0;
    } else if (selectedText) {
        link = '[' + selectedText + '](url)';
        cursorPos = from + selectedText.length + 3; // Position at 'url'
        selectionLength = 3;
    } else {
        link = '[](url)';
        cursorPos = from + 1; // Position inside []
        selectionLength = 0;
    }

    view.dispatch({
        changes: { from, to, insert: link },
        selection: { anchor: cursorPos, head: cursorPos + selectionLength },
    });

    view.focus();
    return true;
}

/**
 * Insert an image at the current position
 * Wraps as ![alt](url)
 */
export function insertImage(view: EditorView): boolean {
    const { from, to } = view.state.selection.main;
    const selectedText = view.state.sliceDoc(from, to);
    const altText = selectedText || 'image';

    view.dispatch({
        changes: {
            from,
            to,
            insert: `![${altText}](url)`,
        },
        selection: {
            anchor: from + altText.length + 4, // Selection at 'url'
            head: from + altText.length + 7,
        },
    });

    view.focus();
    return true;
}
