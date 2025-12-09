import { keymap } from '@codemirror/view';
import type { EditorView } from '@codemirror/view';
import type { Extension } from '@codemirror/state';
import { getTableCellPositions, findCellAtCursor, navigateToCell } from '../decorations/table';

/**
 * Check if cursor is inside a markdown table
 */
function isInTable(view: EditorView): boolean {
    const { from } = view.state.selection.main;
    const line = view.state.doc.lineAt(from);
    
    // Check current line and nearby lines for table markers
    for (let i = Math.max(1, line.number - 5); i <= Math.min(view.state.doc.lines, line.number + 5); i++) {
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
    const headers = lines[0]?.split('|').filter(h => h.trim()).length || 0;
    const rows = lines.slice(2).filter(l => l.includes('|')).length;
    
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
 * Navigate to adjacent cell
 */
function navigateCell(view: EditorView, direction: 'left' | 'right' | 'up' | 'down'): boolean {
    if (!isInTable(view)) return false;
    
    const tableData = getCurrentTableData(view);
    const positions = getTableCellPositions(view, tableData as any);
    const current = findCellAtCursor(positions, view.state.selection.main.from);
    
    if (!current) return false;
    
    const next = navigateToCell(positions, current, direction);
    if (!next) return false;
    
    // Move cursor to start of next cell content (skip whitespace and |)
    const cellText = view.state.doc.sliceString(next.start, next.end);
    const trimStart = cellText.match(/^\s*\|?\s*/)?.[0].length || 0;
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
    const emptyRow = '| ' + Array(tableData.headers).fill('     ').join(' | ') + ' |';
    
    view.dispatch({
        changes: {
            from: endLine.to,
            insert: '\n' + emptyRow,
        },
        selection: {
            anchor: endLine.to + 3, // Position in first cell of new row
        },
        scrollIntoView: true,
    });
    
    return true;
}

/**
 * Add new column to table
 */
function insertTableColumn(view: EditorView): boolean {
    if (!isInTable(view)) return false;
    
    const tableData = getCurrentTableData(view);
    const changes: any[] = [];
    
    // Add to each line
    for (let i = tableData.startLine; i <= tableData.endLine; i++) {
        const line = view.state.doc.line(i);
        const text = view.state.doc.sliceString(line.from, line.to);
        
        // Find last | and insert before it
        const lastPipe = text.lastIndexOf('|');
        if (lastPipe > 0) {
            const isSeparator = /^\s*\|[\s\-:|]+\|\s*$/.test(text);
            const insertion = isSeparator ? '---------|' : '       |';
            
            changes.push({
                from: line.from + lastPipe,
                insert: insertion,
            });
        }
    }
    
    view.dispatch({
        changes,
        scrollIntoView: true,
    });
    
    return true;
}

/**
 * Create table navigation keymap extension
 */
export function createTableNavigationKeymap(): Extension {
    return keymap.of([
        // Alt + Arrow keys for navigation
        {
            key: 'Alt-ArrowLeft',
            run: (view) => navigateCell(view, 'left'),
        },
        {
            key: 'Alt-ArrowRight',
            run: (view) => navigateCell(view, 'right'),
        },
        {
            key: 'Alt-ArrowUp',
            run: (view) => navigateCell(view, 'up'),
        },
        {
            key: 'Alt-ArrowDown',
            run: (view) => navigateCell(view, 'down'),
        },
        // Vim mode navigation (Alt + hjkl)
        {
            key: 'Alt-h',
            run: (view) => navigateCell(view, 'left'),
        },
        {
            key: 'Alt-l',
            run: (view) => navigateCell(view, 'right'),
        },
        {
            key: 'Alt-k',
            run: (view) => navigateCell(view, 'up'),
        },
        {
            key: 'Alt-j',
            run: (view) => navigateCell(view, 'down'),
        },
        // Tab navigation
        {
            key: 'Tab',
            run: (view) => {
                if (!isInTable(view)) return false;
                const moved = navigateCell(view, 'right');
                if (!moved) {
                    // At end of row, try adding column
                    return insertTableColumn(view);
                }
                return true;
            },
        },
        {
            key: 'Shift-Tab',
            run: (view) => navigateCell(view, 'left'),
        },
        // Enter to add new row
        {
            key: 'Alt-Enter',
            run: (view) => insertTableRow(view),
        },
    ]);
}
