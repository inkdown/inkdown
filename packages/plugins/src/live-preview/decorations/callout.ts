import type { Range } from '@codemirror/state';
import type { EditorView } from '@codemirror/view';
import { Decoration, WidgetType } from '@codemirror/view';

/**
 * Create decorations for callouts/alerts (> [!INFO] Title)
 * Styles the callout block and hides the markdown syntax
 */
export function createCalloutDecorations(
    view: EditorView,
    from: number,
    to: number,
): Range<Decoration>[] {
    const decorations: Range<Decoration>[] = [];

    // We don't check shouldDecorate here because we want callouts to always look like callouts
    // even when editing (except the header line might reveal syntax)

    const text = view.state.doc.sliceString(from, to);

    // Match callout header: > [!TYPE] Title
    const calloutHeaderRegex = /^>\s*\[!(\w+)\](.*)$/;
    const match = calloutHeaderRegex.exec(text);

    if (match) {
        const type = match[1].toLowerCase();
        const title = match[2].trim();

        // Hide the entire header line and replace with a styled widget
        decorations.push(
            Decoration.replace({
                widget: new CalloutHeaderWidget(type, title),
                block: true,
            }).range(from, to),
        );
    } else if (text.startsWith('>')) {
        // Check if this line is part of a callout block (continuation)
        // This is a bit complex in line-by-line processing without state
        // For now, we'll just style it as a quote if it's not a callout header
        // The Quote decoration handles this, so we don't need to do anything here
        // UNLESS we want to style callout content differently.
        // For simplicity, we'll let the quote decoration handle standard > lines
    }

    return decorations;
}

class CalloutHeaderWidget extends WidgetType {
    constructor(
        private type: string,
        private title: string,
    ) {
        super();
    }

    toDOM() {
        const div = document.createDiv({ cls: `cm-callout cm-callout-${this.type}` });

        div.createSpan({
            cls: 'cm-callout-icon',
            text: this.getIconForType(this.type),
        });

        div.createSpan({
            cls: 'cm-callout-title',
            text: this.title || this.type.charAt(0).toUpperCase() + this.type.slice(1),
        });

        return div;
    }

    getIconForType(type: string): string {
        switch (type) {
            case 'info':
                return 'ℹ️';
            case 'warning':
                return '⚠️';
            case 'error':
                return '🚫';
            case 'success':
                return '✅';
            case 'note':
                return '📝';
            case 'tip':
                return '💡';
            default:
                return '📌';
        }
    }
}
