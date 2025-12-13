/**
 * Block-level commands (headers, code blocks, blockquotes, etc.)
 */

import type { EditorView } from '@codemirror/view';
import { toggleLinePrefix } from './utils';

/**
 * Insert Header 1
 */
export function insertHeader1(view: EditorView): boolean {
    return toggleLinePrefix(view, '# ');
}

/**
 * Insert Header 2
 */
export function insertHeader2(view: EditorView): boolean {
    return toggleLinePrefix(view, '## ');
}

/**
 * Insert Header 3
 */
export function insertHeader3(view: EditorView): boolean {
    return toggleLinePrefix(view, '### ');
}

/**
 * Insert Header 4
 */
export function insertHeader4(view: EditorView): boolean {
    return toggleLinePrefix(view, '#### ');
}

/**
 * Insert Header 5
 */
export function insertHeader5(view: EditorView): boolean {
    return toggleLinePrefix(view, '##### ');
}

/**
 * Insert Header 6
 */
export function insertHeader6(view: EditorView): boolean {
    return toggleLinePrefix(view, '###### ');
}

/**
 * Toggle blockquote on current line
 */
export function toggleBlockquote(view: EditorView): boolean {
    return toggleLinePrefix(view, '> ');
}

/**
 * Insert a fenced code block
 * If text is selected, wraps it in the code block
 */
export function insertCodeBlock(view: EditorView): boolean {
    const { from, to } = view.state.selection.main;
    const selectedText = view.state.sliceDoc(from, to);

    const codeBlock = `\`\`\`\n${selectedText}${selectedText ? '\n' : ''}\`\`\``;

    // Position cursor after the opening ``` to type language
    const cursorPos = from + 3;

    view.dispatch({
        changes: { from, to, insert: codeBlock },
        selection: { anchor: cursorPos },
    });

    view.focus();
    return true;
}

/**
 * Insert a horizontal rule
 */
export function insertHorizontalRule(view: EditorView): boolean {
    const { from } = view.state.selection.main;
    const line = view.state.doc.lineAt(from);

    // Insert at end of current line with proper spacing
    const insert = line.text.length > 0 ? '\n\n---\n\n' : '---\n\n';

    view.dispatch({
        changes: { from: line.to, insert },
    });

    view.focus();
    return true;
}

/**
 * Insert a table template
 */
export function insertTable(view: EditorView): boolean {
    const { from } = view.state.selection.main;
    const line = view.state.doc.lineAt(from);

    const table = `
| Header 1 | Header 2 | Header 3 |
|----------|----------|----------|
| Cell 1   | Cell 2   | Cell 3   |
| Cell 4   | Cell 5   | Cell 6   |
`;

    // Insert at end of current line
    const insert = line.text.length > 0 ? `\n${table}` : table.trimStart();

    view.dispatch({
        changes: { from: line.to, insert },
    });

    view.focus();
    return true;
}

/**
 * Insert an image placeholder
 */
export function insertImage(view: EditorView): boolean {
    const { from, to } = view.state.selection.main;
    const selectedText = view.state.sliceDoc(from, to);

    // Check if selected text is a URL
    const isUrl = /^https?:\/\//.test(selectedText);

    let image: string;
    let cursorPos: number;

    if (isUrl) {
        image = `![alt text](${selectedText})`;
        cursorPos = from + 2; // Position at 'alt text'
    } else if (selectedText) {
        image = `![${selectedText}](url)`;
        cursorPos = from + selectedText.length + 4; // Position at 'url'
    } else {
        image = '![alt text](url)';
        cursorPos = from + 2; // Position at 'alt text'
    }

    view.dispatch({
        changes: { from, to, insert: image },
        selection: { anchor: cursorPos, head: cursorPos + (isUrl ? 8 : selectedText ? 3 : 8) },
    });

    view.focus();
    return true;
}
