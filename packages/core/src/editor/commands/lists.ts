/**
 * List commands (bullet, numbered, task lists)
 */

import type { EditorView } from '@codemirror/view';
import { getLeadingWhitespace, getListInfo } from './utils';

type ListType = 'bullet' | 'numbered' | 'task';

/**
 * Internal function to toggle a list type on selected lines
 */
function toggleListType(view: EditorView, listType: ListType): boolean {
    const { from, to } = view.state.selection.main;
    const startLine = view.state.doc.lineAt(from);
    const endLine = view.state.doc.lineAt(to);

    const changes: { from: number; to: number; insert: string }[] = [];

    for (let lineNum = startLine.number; lineNum <= endLine.number; lineNum++) {
        const line = view.state.doc.line(lineNum);
        const lineText = line.text;
        const listInfo = getListInfo(lineText);

        // Determine the prefix based on list type
        const indent = listInfo.indent || getLeadingWhitespace(lineText);
        let prefix: string;

        switch (listType) {
            case 'bullet':
                prefix = indent + '- ';
                break;
            case 'numbered':
                prefix = indent + '1. ';
                break;
            case 'task':
                prefix = indent + '- [ ] ';
                break;
        }

        if (listInfo.type === listType) {
            // Same type - remove the list marker
            changes.push({
                from: line.from,
                to: line.from + listInfo.fullMatch.length,
                insert: listInfo.indent, // Keep the indentation
            });
        } else if (listInfo.type !== null) {
            // Different list type - replace the marker
            changes.push({
                from: line.from,
                to: line.from + listInfo.fullMatch.length,
                insert: prefix,
            });
        } else {
            // No list marker - add one
            const leadingSpace = getLeadingWhitespace(lineText);
            changes.push({
                from: line.from + leadingSpace.length,
                to: line.from + leadingSpace.length,
                insert: prefix.trimStart(),
            });
        }
    }

    if (changes.length > 0) {
        view.dispatch({ changes });
    }

    view.focus();
    return true;
}

/**
 * Toggle bullet list on selected lines
 */
export function toggleBulletList(view: EditorView): boolean {
    return toggleListType(view, 'bullet');
}

/**
 * Toggle numbered list on selected lines
 */
export function toggleNumberedList(view: EditorView): boolean {
    return toggleListType(view, 'numbered');
}

/**
 * Toggle task list on selected lines
 */
export function toggleTaskList(view: EditorView): boolean {
    return toggleListType(view, 'task');
}

/**
 * Toggle the checkbox state of a task list item
 */
export function toggleTaskCheckbox(view: EditorView): boolean {
    const { from } = view.state.selection.main;
    const line = view.state.doc.lineAt(from);
    const lineText = line.text;

    // Match task list pattern: - [ ] or - [x]
    const taskMatch = lineText.match(/^(\s*[-*+]\s\[)([x\s])(\]\s)/i);

    if (taskMatch) {
        const checkPos = line.from + taskMatch[1].length;
        const isChecked = taskMatch[2].toLowerCase() === 'x';

        view.dispatch({
            changes: {
                from: checkPos,
                to: checkPos + 1,
                insert: isChecked ? ' ' : 'x',
            },
        });

        view.focus();
        return true;
    }

    return false;
}
