/**
 * Utility functions for editor commands
 */

import type { EditorView } from '@codemirror/view';

/**
 * Wrap the selected text with prefix and suffix.
 * If already wrapped, removes the wrapping (toggle behavior).
 */
export function wrapSelection(view: EditorView, prefix: string, suffix: string): boolean {
    const { from, to } = view.state.selection.main;
    const selectedText = view.state.sliceDoc(from, to);

    // Check if text before and after selection matches prefix/suffix
    const beforePrefix = view.state.sliceDoc(Math.max(0, from - prefix.length), from);
    const afterSuffix = view.state.sliceDoc(to, to + suffix.length);

    if (beforePrefix === prefix && afterSuffix === suffix) {
        // Remove wrapping from outside
        view.dispatch({
            changes: [
                { from: from - prefix.length, to: from, insert: '' },
                { from: to, to: to + suffix.length, insert: '' },
            ],
            selection: { anchor: from - prefix.length, head: to - prefix.length },
        });
    } else if (
        selectedText.startsWith(prefix) &&
        selectedText.endsWith(suffix) &&
        selectedText.length >= prefix.length + suffix.length
    ) {
        // Remove wrapping from inside selection
        const unwrapped = selectedText.slice(prefix.length, -suffix.length);
        view.dispatch({
            changes: { from, to, insert: unwrapped },
            selection: { anchor: from, head: from + unwrapped.length },
        });
    } else {
        // Add wrapping
        const wrapped = prefix + selectedText + suffix;
        view.dispatch({
            changes: { from, to, insert: wrapped },
            selection: { anchor: from + prefix.length, head: to + prefix.length },
        });
    }

    view.focus();
    return true;
}

/**
 * Toggle a line prefix (for headers, blockquotes, etc.)
 * If the line already has the prefix, removes it.
 * If the line has a different header prefix, replaces it.
 */
export function toggleLinePrefix(view: EditorView, prefix: string): boolean {
    const { from } = view.state.selection.main;
    const line = view.state.doc.lineAt(from);
    const lineText = line.text;

    if (lineText.startsWith(prefix)) {
        // Remove prefix
        view.dispatch({
            changes: { from: line.from, to: line.from + prefix.length, insert: '' },
        });
    } else {
        // Check if there's another header prefix to replace
        const headerMatch = lineText.match(/^#{1,6}\s/);
        if (headerMatch) {
            view.dispatch({
                changes: { from: line.from, to: line.from + headerMatch[0].length, insert: prefix },
            });
        } else {
            // Add prefix
            view.dispatch({
                changes: { from: line.from, insert: prefix },
            });
        }
    }

    view.focus();
    return true;
}

/**
 * Get information about the current line's list type
 */
export interface ListInfo {
    type: 'bullet' | 'numbered' | 'task' | null;
    indent: string;
    fullMatch: string;
}

export function getListInfo(lineText: string): ListInfo {
    const taskMatch = lineText.match(/^(\s*)[-*+]\s\[[x\s]\]\s/i);
    if (taskMatch) {
        return { type: 'task', indent: taskMatch[1], fullMatch: taskMatch[0] };
    }

    const bulletMatch = lineText.match(/^(\s*)[-*+]\s/);
    if (bulletMatch) {
        return { type: 'bullet', indent: bulletMatch[1], fullMatch: bulletMatch[0] };
    }

    const numberedMatch = lineText.match(/^(\s*)\d+\.\s/);
    if (numberedMatch) {
        return { type: 'numbered', indent: numberedMatch[1], fullMatch: numberedMatch[0] };
    }

    return { type: null, indent: '', fullMatch: '' };
}

/**
 * Get the leading whitespace of a line
 */
export function getLeadingWhitespace(lineText: string): string {
    const match = lineText.match(/^(\s*)/);
    return match ? match[1] : '';
}
