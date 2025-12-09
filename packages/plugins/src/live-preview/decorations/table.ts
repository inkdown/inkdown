import type { Range } from '@codemirror/state';
import type { EditorView } from '@codemirror/view';
import { Decoration, WidgetType } from '@codemirror/view';

/**
 * Table structure parsed from markdown
 */
interface TableData {
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
interface CellPosition {
    row: number;
    col: number;
    start: number;
    end: number;
}

/**
 * Parse markdown table from text
 */
function parseTable(text: string, from: number, doc: any): TableData | null {
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
        .map(h => h.trim())
        .filter(h => h.length > 0);
    
    if (headers.length === 0) return null;
    
    // Parse rows
    const rows: string[][] = [];
    for (let i = 2; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line.includes('|')) break;
        
        const cells = line
            .split('|')
            .map(c => c.trim())
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
 */
export function getTableCellPositions(view: EditorView, tableData: TableData): CellPosition[] {
    const positions: CellPosition[] = [];
    const doc = view.state.doc;
    
    // Calculate positions for each cell
    for (let lineNum = tableData.startLine; lineNum <= tableData.endLine; lineNum++) {
        const line = doc.line(lineNum);
        const text = doc.sliceString(line.from, line.to);
        
        // Skip separator line
        if (/^\s*\|[\s\-:|]+\|\s*$/.test(text)) continue;
        
        const isHeader = lineNum === tableData.startLine;
        const rowIndex = isHeader ? -1 : lineNum - tableData.startLine - 2;
        
        let colIndex = 0;
        let inCell = false;
        let cellStart = line.from;
        
        for (let i = 0; i < text.length; i++) {
            if (text[i] === '|') {
                if (inCell) {
                    // End of cell
                    positions.push({
                        row: rowIndex,
                        col: colIndex,
                        start: cellStart,
                        end: line.from + i,
                    });
                    colIndex++;
                    inCell = false;
                } else {
                    // Start of cell
                    cellStart = line.from + i + 1;
                    inCell = true;
                }
            }
        }
    }
    
    return positions;
}

/**
 * Find cell at cursor position
 */
export function findCellAtCursor(positions: CellPosition[], cursorPos: number): CellPosition | null {
    return positions.find(p => cursorPos >= p.start && cursorPos <= p.end) || null;
}

/**
 * Navigate to adjacent cell
 */
export function navigateToCell(
    positions: CellPosition[],
    current: CellPosition,
    direction: 'left' | 'right' | 'up' | 'down'
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
    
    return positions.find(p => p.row === targetRow && p.col === targetCol) || null;
}

/**
 * Create decorations for markdown tables
 * Renders table as HTML when cursor is outside
 */
export function createTableDecorations(
    view: EditorView,
    from: number,
    to: number,
): Range<Decoration>[] {
    const decorations: Range<Decoration>[] = [];
    const doc = view.state.doc;
    const text = doc.sliceString(from, to);
    
    // Check if line starts a table
    if (!text.includes('|')) return decorations;
    
    // Try to parse table starting from this line
    const lineStart = doc.lineAt(from);
    const remainingText = doc.sliceString(lineStart.from, Math.min(lineStart.from + 10000, doc.length));
    
    const tableData = parseTable(remainingText, lineStart.from, doc);
    if (!tableData) return decorations;
    
    // Only process if we're at the start line
    if (from !== tableData.startPos) return decorations;
    
    // Check if cursor is in the table range
    const selection = view.state.selection.main;
    const cursorInTable = selection.from >= tableData.startPos && selection.from <= tableData.endPos;
    
    if (cursorInTable) {
        // Show raw markdown when cursor is in table
        return decorations;
    }
    
    // Replace entire table with widget
    decorations.push(
        Decoration.replace({
            widget: new TableWidget(tableData),
            block: true,
        }).range(tableData.startPos, tableData.endPos),
    );
    
    return decorations;
}

/**
 * Widget for rendering HTML table
 */
class TableWidget extends WidgetType {
    constructor(private tableData: TableData) {
        super();
    }
    
    toDOM() {
        const container = document.createElement('div');
        container.className = 'cm-table-widget';
        
        const table = document.createElement('table');
        table.className = 'cm-table';
        
        // Create header
        const thead = document.createElement('thead');
        const headerRow = document.createElement('tr');
        
        for (const header of this.tableData.headers) {
            const th = document.createElement('th');
            th.textContent = header;
            headerRow.appendChild(th);
        }
        
        thead.appendChild(headerRow);
        table.appendChild(thead);
        
        // Create body
        const tbody = document.createElement('tbody');
        
        for (const row of this.tableData.rows) {
            const tr = document.createElement('tr');
            
            for (let i = 0; i < this.tableData.headers.length; i++) {
                const td = document.createElement('td');
                td.textContent = row[i] || '';
                tr.appendChild(td);
            }
            
            tbody.appendChild(tr);
        }
        
        table.appendChild(tbody);
        container.appendChild(table);
        
        return container;
    }
    
    eq(other: TableWidget): boolean {
        return (
            this.tableData.headers.length === other.tableData.headers.length &&
            this.tableData.rows.length === other.tableData.rows.length &&
            this.tableData.startPos === other.tableData.startPos
        );
    }
    
    ignoreEvent(): boolean {
        return false;
    }
}
