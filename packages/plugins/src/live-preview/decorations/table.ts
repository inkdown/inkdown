import type { Range } from '@codemirror/state';
import type { EditorView } from '@codemirror/view';
import { Decoration, WidgetType } from '@codemirror/view';

/**
 * Table structure parsed from markdown
 */
export interface TableData {
    headers: string[];
    rows: string[][];
    startLine: number;
    endLine: number;
    startPos: number;
    endPos: number;
}

/**
 * Cell position in table
 */
export interface CellPosition {
    row: number; // 0 = header, 1+ = data rows
    col: number;
    start: number;
    end: number;
}

/**
 * Parse markdown table from text
 */
export function parseTable(text: string, from: number, doc: any): TableData | null {
    const lines = text.split('\n');

    if (lines.length < 3) return null;

    // First line should be header
    const headerLine = lines[0];
    if (!headerLine.includes('|')) return null;

    // Second line should be separator (|---|---|)
    const separatorLine = lines[1];
    if (!/^\s*\|[\s\-:|]+\|\s*$/.test(separatorLine)) return null;

    // Parse headers
    const headers = headerLine
        .split('|')
        .map((h) => h.trim())
        .filter((h) => h.length > 0);

    if (headers.length === 0) return null;

    // Parse rows
    const rows: string[][] = [];
    for (let i = 2; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line.includes('|')) break;

        const cells = line
            .split('|')
            .map((c) => c.trim())
            .filter((c, idx, arr) => {
                // Filter out empty cells at start/end
                if (idx === 0 || idx === arr.length - 1) return c.length > 0;
                return true;
            });

        if (cells.length > 0) {
            rows.push(cells);
        }
    }

    const lineCount = 2 + rows.length;
    const startLineObj = doc.lineAt(from);
    const endLineObj = doc.line(Math.min(startLineObj.number + lineCount - 1, doc.lines));

    return {
        headers,
        rows,
        startLine: startLineObj.number,
        endLine: endLineObj.number,
        startPos: from,
        endPos: endLineObj.to,
    };
}

/**
 * Get cell positions for navigation
 * Row 0 = header, Row 1+ = data rows
 */
export function getTableCellPositions(
    view: EditorView,
    tableData: { startLine: number; endLine: number },
): CellPosition[] {
    const positions: CellPosition[] = [];
    const doc = view.state.doc;

    let dataRowIndex = 0;

    for (let lineNum = tableData.startLine; lineNum <= tableData.endLine; lineNum++) {
        const line = doc.line(lineNum);
        const text = doc.sliceString(line.from, line.to);

        // Skip separator line
        if (/^\s*\|[\s\-:|]+\|\s*$/.test(text)) continue;

        const isHeader = lineNum === tableData.startLine;
        const rowIndex = isHeader ? 0 : dataRowIndex + 1;

        if (!isHeader) {
            dataRowIndex++;
        }

        let colIndex = 0;
        let cellStart = -1;

        for (let i = 0; i < text.length; i++) {
            if (text[i] === '|') {
                if (cellStart >= 0) {
                    positions.push({
                        row: rowIndex,
                        col: colIndex,
                        start: cellStart,
                        end: line.from + i,
                    });
                    colIndex++;
                }
                cellStart = line.from + i + 1;
            }
        }
    }

    return positions;
}

/**
 * Find cell at cursor position
 */
export function findCellAtCursor(
    positions: CellPosition[],
    cursorPos: number,
): CellPosition | null {
    return positions.find((p) => cursorPos >= p.start && cursorPos <= p.end) || null;
}

/**
 * Navigate to adjacent cell
 */
export function navigateToCell(
    positions: CellPosition[],
    current: CellPosition,
    direction: 'left' | 'right' | 'up' | 'down',
): CellPosition | null {
    const { row, col } = current;

    let targetRow = row;
    let targetCol = col;

    switch (direction) {
        case 'left':
            targetCol = col - 1;
            break;
        case 'right':
            targetCol = col + 1;
            break;
        case 'up':
            targetRow = row - 1;
            break;
        case 'down':
            targetRow = row + 1;
            break;
    }

    if (targetRow < 0) return null;

    return positions.find((p) => p.row === targetRow && p.col === targetCol) || null;
}

/**
 * Widget for pipe character - renders as vertical border
 */
class PipeWidget extends WidgetType {
    constructor(
        private isFirst: boolean,
        private isLast: boolean,
    ) {
        super();
    }

    toDOM(): HTMLElement {
        const span = document.createElement('span');
        span.className = 'cm-table-pipe-widget';
        if (this.isFirst) span.classList.add('cm-table-pipe-first');
        if (this.isLast) span.classList.add('cm-table-pipe-last');
        return span;
    }

    eq(other: PipeWidget): boolean {
        return this.isFirst === other.isFirst && this.isLast === other.isLast;
    }

    ignoreEvent(): boolean {
        return false;
    }
}

// Line decoration for table rows
const tableRowDecoration = Decoration.line({ class: 'cm-table-row' });
const tableHeaderRowDecoration = Decoration.line({ class: 'cm-table-row cm-table-header-row' });

/**
 * Create in-place decorations for markdown tables
 * Replaces | with PipeWidget and wraps cell content in wrapper span
 */
export function createTableDecorations(
    view: EditorView,
    from: number,
    to: number,
): Range<Decoration>[] {
    const decorations: Range<Decoration>[] = [];
    const doc = view.state.doc;
    const text = doc.sliceString(from, to);

    if (!text.includes('|')) return decorations;

    const lineStart = doc.lineAt(from);

    // Search backwards to find the start of the table
    // This allows us to correctly decorate tables even when 'from' is in the middle
    let tableStartLine = lineStart.number;
    for (let i = lineStart.number; i >= 1; i--) {
        const checkLine = doc.line(i);
        const checkText = doc.sliceString(checkLine.from, checkLine.to);
        if (!checkText.includes('|')) {
            tableStartLine = i + 1;
            break;
        }
        if (i === 1) tableStartLine = 1;
    }

    // Verify it's actually a table by checking for separator
    const potentialHeaderLine = doc.line(tableStartLine);
    const potentialSeparatorLine = doc.line(Math.min(tableStartLine + 1, doc.lines));
    const sepText = doc.sliceString(potentialSeparatorLine.from, potentialSeparatorLine.to);

    if (!/^\s*\|[\s\-:|]+\|\s*$/.test(sepText)) return decorations;

    // Parse from the REAL start
    const textStart = potentialHeaderLine.from;
    const remainingText = doc.sliceString(textStart, Math.min(textStart + 10000, doc.length));

    const tableData = parseTable(remainingText, textStart, doc);

    // Safety check
    if (!tableData) return decorations;

    // Only proceed if our range intersects with the table
    if (from > tableData.endPos || to < tableData.startPos) return decorations;

    // Process each line in the table
    for (let lineNum = tableData.startLine; lineNum <= tableData.endLine; lineNum++) {
        const line = doc.line(lineNum);
        const lineText = doc.sliceString(line.from, line.to);

        const isSeparator = /^\s*\|[\s\-:|]+\|\s*$/.test(lineText);
        const isHeader = lineNum === tableData.startLine;

        if (isSeparator) {
            // Style separator text
            decorations.push(
                Decoration.mark({
                    class: 'cm-table-separator-text',
                }).range(line.from, line.to),
            );

            decorations.push(
                Decoration.line({ class: 'cm-table-row cm-table-separator-row' }).range(line.from),
            );
        } else {
            // Add line decoration
            decorations.push(
                (isHeader ? tableHeaderRowDecoration : tableRowDecoration).range(line.from),
            );

            // Find and replace pipe characters
            const pipePositions: number[] = [];
            for (let i = 0; i < lineText.length; i++) {
                if (lineText[i] === '|') {
                    pipePositions.push(i);
                }
            }

            // Replace each pipe with widget
            for (let i = 0; i < pipePositions.length; i++) {
                const pos = line.from + pipePositions[i];
                const isFirst = i === 0;
                const isLast = i === pipePositions.length - 1;

                decorations.push(
                    Decoration.replace({
                        widget: new PipeWidget(isFirst, isLast),
                    }).range(pos, pos + 1),
                );
            }
        }
    }

    return decorations;
}
