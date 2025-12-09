import type { Range } from '@codemirror/state';
import type { EditorView } from '@codemirror/view';
import { Decoration, WidgetType } from '@codemirror/view';

/**
 * Callout types supported (GitHub-compatible)
 */
type CalloutType = 'note' | 'tip' | 'important' | 'warning' | 'caution';

/**
 * Create decorations for callouts/alerts (> [!TYPE] Title)
 * Supports GitHub-style callouts with proper multi-line handling
 * Shows raw syntax when cursor is in the callout block
 */
export function createCalloutDecorations(
    view: EditorView,
    from: number,
    to: number,
): Range<Decoration>[] {
    const decorations: Range<Decoration>[] = [];
    const doc = view.state.doc;
    const text = doc.sliceString(from, to);

    // Match callout header: > [!TYPE] optional title
    const calloutHeaderRegex = /^>\s*\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]\s*(.*)$/i;
    const match = calloutHeaderRegex.exec(text);

    if (!match) return decorations;

    const type = match[1].toLowerCase() as CalloutType;
    const customTitle = match[2].trim();
    const lineNumber = doc.lineAt(from).number;

    // Find all continuation lines (lines starting with >)
    const calloutLines: number[] = [lineNumber];
    let nextLineNum = lineNumber + 1;
    
    // Find continuation lines for the entire callout block
    while (nextLineNum <= doc.lines) {
        const nextLine = doc.line(nextLineNum);
        const nextText = doc.sliceString(nextLine.from, nextLine.to);
        
        if (!nextText.startsWith('>')) {
            break;
        }
        
        calloutLines.push(nextLineNum);
        nextLineNum++;
    }

    // Check if cursor is anywhere in the callout block
    let cursorInCallout = false;
    const selection = view.state.selection.main;
    
    for (const lineNum of calloutLines) {
        const line = doc.line(lineNum);
        if (selection.from >= line.from && selection.from <= line.to) {
            cursorInCallout = true;
            break;
        }
    }

    // If cursor is in the callout, don't apply decorations (show raw markdown)
    if (cursorInCallout) {
        return decorations;
    }

    const startLine = doc.line(lineNumber);

    // Only decorate the header line when processing it
    if (from === startLine.from) {
        // Hide the header syntax and replace with styled widget
        decorations.push(
            Decoration.replace({
                widget: new CalloutHeaderWidget(type, customTitle),
            }).range(from, to),
        );
        
        // Apply line decoration to mark this as a callout start
        decorations.push(
            Decoration.line({
                class: `cm-callout-line cm-callout-${type}`,
            }).range(from),
        );
    }

    return decorations;
}

/**
 * Widget for rendering the callout header
 */
class CalloutHeaderWidget extends WidgetType {
    constructor(
        private type: CalloutType,
        private customTitle: string,
    ) {
        super();
    }

    toDOM() {
        const container = document.createElement('div');
        container.className = `cm-callout-header cm-callout-header-${this.type}`;

        // Icon
        const icon = document.createElement('span');
        icon.className = 'cm-callout-icon';
        icon.textContent = this.getIcon(this.type);
        container.appendChild(icon);

        // Title
        const title = document.createElement('span');
        title.className = 'cm-callout-title';
        title.textContent = this.customTitle || this.getDefaultTitle(this.type);
        container.appendChild(title);

        return container;
    }

    private getIcon(type: CalloutType): string {
        const icons: Record<CalloutType, string> = {
            note: '📝',
            tip: '💡',
            important: '❗',
            warning: '⚠️',
            caution: '🚨',
        };
        return icons[type];
    }

    private getDefaultTitle(type: CalloutType): string {
        const titles: Record<CalloutType, string> = {
            note: 'Note',
            tip: 'Tip',
            important: 'Important',
            warning: 'Warning',
            caution: 'Caution',
        };
        return titles[type];
    }

    eq(other: CalloutHeaderWidget): boolean {
        return this.type === other.type && this.customTitle === other.customTitle;
    }

    ignoreEvent(): boolean {
        return false;
    }
}
