import type { Extension } from '@codemirror/state';
import { Prec } from '@codemirror/state';
import type { EditorView } from '@codemirror/view';
import { keymap } from '@codemirror/view';
import { findCellAtCursor, getTableCellPositions, navigateToCell } from '../decorations/table';

/**
 * Check if cursor is inside a markdown table
 */
function isInTable(view: EditorView): boolean {
    const { from } = view.state.selection.main;
    const line = view.state.doc.lineAt(from);

    // Check current line and nearby lines for table markers
    for (
        let i = Math.max(1, line.number - 5);
        i <= Math.min(view.state.doc.lines, line.number + 5);
        i++
    ) {
        const checkLine = view.state.doc.line(i);
        const text = view.state.doc.sliceString(checkLine.from, checkLine.to);

        // Check for separator line (|---|---|)
        if (/^\s*\|[\s\-:|]+\|\s*$/.test(text)) {
            // Found a table, check if cursor is within range
            const tableStart = Math.max(1, i - 1);
            const tableStartLine = view.state.doc.line(tableStart);

            if (from >= tableStartLine.from) {
                return true;
            }
        }
    }

    return false;
}

/**
 * Parse table and get cell positions for current table
 */
function getCurrentTableData(view: EditorView) {
    const { from } = view.state.selection.main;
    const line = view.state.doc.lineAt(from);

    // Find table start by looking backwards
    let tableStartLine = line.number;
    for (let i = line.number; i >= 1; i--) {
        const checkLine = view.state.doc.line(i);
        const text = view.state.doc.sliceString(checkLine.from, checkLine.to);

        if (!text.includes('|')) {
            tableStartLine = i + 1;
            break;
        }

        if (i === 1) {
            tableStartLine = 1;
        }
    }

    // Find table end by looking forwards
    let tableEndLine = line.number;
    for (let i = line.number; i <= view.state.doc.lines; i++) {
        const checkLine = view.state.doc.line(i);
        const text = view.state.doc.sliceString(checkLine.from, checkLine.to);

        if (!text.includes('|')) {
            tableEndLine = i - 1;
            break;
        }

        if (i === view.state.doc.lines) {
            tableEndLine = i;
        }
    }

    const startLine = view.state.doc.line(tableStartLine);
    const endLine = view.state.doc.line(tableEndLine);

    // Parse table structure for cell positions
    const tableText = view.state.doc.sliceString(startLine.from, endLine.to);
    const lines = tableText.split('\n');

    // Simple parsing for headers
    const headers = lines[0]?.split('|').filter((h) => h.trim()).length || 0;
    const rows = lines.slice(2).filter((l) => l.includes('|')).length;

    return {
        startLine: tableStartLine,
        endLine: tableEndLine,
        startPos: startLine.from,
        endPos: endLine.to,
        headers,
        rows,
    };
}

/**
 * Check if cursor is at cell boundary
 */
function isAtCellBoundary(view: EditorView, direction: 'left' | 'right'): boolean {
    const { from } = view.state.selection.main;
    const line = view.state.doc.lineAt(from);
    const text = view.state.doc.sliceString(line.from, line.to);
    const posInLine = from - line.from;

    if (direction === 'right') {
        // Check if next char is | or end of line
        const nextChar = text[posInLine];
        if (!nextChar) return true; // End of line
        // Skip trailing spaces to check for |
        let i = posInLine;
        while (i < text.length && text[i] === ' ') i++;
        return text[i] === '|';
    }
    // Check if previous char is | or start of line
    if (posInLine <= 0) return true; // Start of line
    // Skip leading spaces to check for |
    let i = posInLine - 1;
    while (i >= 0 && text[i] === ' ') i--;
    return text[i] === '|';
}

/**
 * Smart arrow navigation - only jump to next cell at boundaries
 */
function smartNavigateHorizontal(view: EditorView, direction: 'left' | 'right'): boolean {
    if (!isInTable(view)) return false;

    // Check if at cell boundary
    if (!isAtCellBoundary(view, direction)) {
        // Not at boundary - allow default cursor movement
        return false;
    }

    // At boundary - jump to next cell
    const tableData = getCurrentTableData(view);
    const positions = getTableCellPositions(view, tableData as any);
    const current = findCellAtCursor(positions, view.state.selection.main.from);

    if (!current) return false;

    let next = navigateToCell(positions, current, direction);

    // If no next cell in same row and going right, try first cell of next row
    if (!next && direction === 'right') {
        next = positions.find((p) => p.row === current.row + 1 && p.col === 0) || null;
    }

    // If no next cell, allow default behavior
    if (!next) return false;

    // Move cursor to start/end of next cell content
    const cellText = view.state.doc.sliceString(next.start, next.end);
    let newPos: number;

    if (direction === 'right') {
        // Move to start of cell (after leading spaces)
        const trimStart = cellText.match(/^\s*/)?.[0].length || 0;
        newPos = next.start + trimStart;
    } else {
        // Move to end of cell (before trailing spaces)
        const trimEnd = cellText.match(/\s*$/)?.[0].length || 0;
        newPos = next.end - trimEnd;
    }

    view.dispatch({
        selection: { anchor: newPos, head: newPos },
        scrollIntoView: true,
    });

    return true;
}

/**
 * Navigate to same column in adjacent row
 */
function navigateVertical(view: EditorView, direction: 'up' | 'down'): boolean {
    if (!isInTable(view)) return false;

    const tableData = getCurrentTableData(view);
    const positions = getTableCellPositions(view, tableData as any);
    const current = findCellAtCursor(positions, view.state.selection.main.from);

    if (!current) return false;

    const next = navigateToCell(positions, current, direction);
    if (!next) return false;

    // Move cursor to start of next cell content
    const cellText = view.state.doc.sliceString(next.start, next.end);
    const trimStart = cellText.match(/^\s*/)?.[0].length || 0;
    const newPos = next.start + trimStart;

    view.dispatch({
        selection: { anchor: newPos, head: newPos },
        scrollIntoView: true,
    });

    return true;
}

/**
 * Tab navigation - jump directly to next cell, wrap to next row at end
 */
function tabNavigate(view: EditorView, reverse: boolean): boolean {
    if (!isInTable(view)) return false;

    const tableData = getCurrentTableData(view);
    const positions = getTableCellPositions(view, tableData as any);
    const current = findCellAtCursor(positions, view.state.selection.main.from);

    if (!current) return false;

    const direction = reverse ? 'left' : 'right';
    let next = navigateToCell(positions, current, direction);

    // Wrap to next/previous row
    if (!next) {
        if (reverse) {
            // Shift-Tab at start of row: go to last cell of previous row
            const prevRowCells = positions.filter((p) => p.row === current.row - 1);
            if (prevRowCells.length > 0) {
                next = prevRowCells[prevRowCells.length - 1];
            }
        } else {
            // Tab at end of row: go to first cell of next row
            next = positions.find((p) => p.row === current.row + 1 && p.col === 0) || null;
        }
    }

    if (!next) return false;

    // Move to start of cell
    const cellText = view.state.doc.sliceString(next.start, next.end);
    const trimStart = cellText.match(/^\s*/)?.[0].length || 0;
    const newPos = next.start + trimStart;

    view.dispatch({
        selection: { anchor: newPos, head: newPos },
        scrollIntoView: true,
    });

    return true;
}

/**
 * Insert new row at end of table
 */
function insertTableRow(view: EditorView): boolean {
    if (!isInTable(view)) return false;

    const tableData = getCurrentTableData(view);
    const endLine = view.state.doc.line(tableData.endLine);

    // Create new row with empty cells
    const emptyRow = `| ${Array(tableData.headers).fill('     ').join(' | ')} |`;

    view.dispatch({
        changes: {
            from: endLine.to,
            insert: `\n${emptyRow}`,
        },
        selection: {
            anchor: endLine.to + 3, // Position in first cell of new row
        },
        scrollIntoView: true,
    });

    return true;
}

/**
 * Create table navigation keymap extension
 */
export function createTableNavigationKeymap(): Extension {
    // Use Prec.high to override Tab indentation when inside tables
    return Prec.high(
        keymap.of([
            // Arrow keys - smart navigation (only jump at boundaries)
            {
                key: 'ArrowLeft',
                run: (view) => smartNavigateHorizontal(view, 'left'),
            },
            {
                key: 'ArrowRight',
                run: (view) => smartNavigateHorizontal(view, 'right'),
            },
            {
                key: 'ArrowUp',
                run: (view) => navigateVertical(view, 'up'),
            },
            {
                key: 'ArrowDown',
                run: (view) => navigateVertical(view, 'down'),
            },
            // Tab navigation - jump directly between cells
            {
                key: 'Tab',
                run: (view) => tabNavigate(view, false),
            },
            {
                key: 'Shift-Tab',
                run: (view) => tabNavigate(view, true),
            },
            // Enter to add new row (when in table)
            {
                key: 'Enter',
                run: (view) => {
                    if (!isInTable(view)) return false;
                    return insertTableRow(view);
                },
            },
        ]),
    );
}
