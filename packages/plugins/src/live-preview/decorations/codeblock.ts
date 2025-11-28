import type { Range } from '@codemirror/state';
import type { EditorView } from '@codemirror/view';
import { Decoration } from '@codemirror/view';
import { LanguageBadgeWidget } from '../widgets/LanguageBadge';

/**
 * Create decorations for code block markers (```lang ... ```)
 * Hides the backticks and adds language badge when cursor is not inside
 *
 * Note: Background styling is handled by livePreviewExtension
 */
export function createCodeBlockDecorations(
    view: EditorView,
    from: number,
    to: number,
): Range<Decoration>[] {
    const decorations: Range<Decoration>[] = [];
    const text = view.state.doc.sliceString(from, to);

    // Match opening code fence: ```language
    const openingMatch = /^```(\w*)/.exec(text);
    if (openingMatch) {
        const language = openingMatch[1] || 'text';
        const matchFrom = from;
        const matchTo = from + openingMatch[0].length;

        // Find the end of the code block
        const lineNumber = view.state.doc.lineAt(from).number;
        const blockEnd = findCodeBlockEnd(view, lineNumber);

        if (blockEnd && !isSelectionInRange(view, from, blockEnd)) {
            // Hide opening backticks
            decorations.push(Decoration.replace({}).range(matchFrom, matchTo));

            // Add language badge at the end of the line
            // The badge will be positioned via CSS
            decorations.push(
                Decoration.widget({
                    widget: new LanguageBadgeWidget(language),
                    side: 1,
                    block: false,
                }).range(matchTo),
            );
        }
    }

    // Match closing code fence: ```
    const closingMatch = /^```\s*$/.exec(text);
    if (closingMatch) {
        const matchFrom = from;
        const matchTo = from + closingMatch[0].length;

        // Find if this is part of a code block
        const lineNumber = view.state.doc.lineAt(from).number;
        const blockStart = findCodeBlockStart(view, lineNumber);

        if (blockStart && !isSelectionInRange(view, blockStart, to)) {
            // Hide closing backticks
            decorations.push(Decoration.replace({}).range(matchFrom, matchTo));
        }
    }

    return decorations;
}

/**
 * Find the end of a code block starting from a line number
 */
function findCodeBlockEnd(view: EditorView, startLine: number): number | null {
    const doc = view.state.doc;
    const totalLines = doc.lines;

    for (let lineNum = startLine + 1; lineNum <= totalLines; lineNum++) {
        const line = doc.line(lineNum);
        const text = line.text;

        if (/^```\s*$/.test(text)) {
            return line.to;
        }
    }

    return null;
}

/**
 * Find the start of a code block ending at a line number
 */
function findCodeBlockStart(view: EditorView, endLine: number): number | null {
    const doc = view.state.doc;

    for (let lineNum = endLine - 1; lineNum >= 1; lineNum--) {
        const line = doc.line(lineNum);
        const text = line.text;

        if (/^```\w*/.test(text)) {
            return line.from;
        }
    }

    return null;
}

/**
 * Check if selection is within a range
 */
function isSelectionInRange(view: EditorView, from: number, to: number): boolean {
    const selection = view.state.selection.main;
    return selection.from >= from && selection.to <= to;
}
