import type { Range } from '@codemirror/state';
import type { EditorView } from '@codemirror/view';
import { Decoration, WidgetType } from '@codemirror/view';
import { shouldDecorate } from '../utils/selection';

/**
 * Widget for rendering clickable links
 */
class LinkWidget extends WidgetType {
    constructor(
        private text: string,
        private url: string,
    ) {
        super();
    }

    toDOM(): HTMLElement {
        const link = document.createEl('a', {
            href: this.url,
            text: this.text,
            cls: 'cm-link-widget',
            attr: {
                style: 'color: var(--syntax-link); text-decoration: underline; cursor: pointer;',
            },
        });

        // Open in new tab/window
        link.addEventListener('click', (e) => {
            e.preventDefault();
            window.open(this.url, '_blank');
        });

        return link;
    }

    ignoreEvent(event: Event): boolean {
        // Allow click events to be handled by the link
        return event.type === 'mousedown';
    }
}

/**
 * Create decorations for links ([text](url))
 * Replaces markdown syntax with clickable link widget
 */
export function createLinkDecorations(
    view: EditorView,
    from: number,
    to: number,
): Range<Decoration>[] {
    const decorations: Range<Decoration>[] = [];

    if (!shouldDecorate(view, from, to)) {
        return decorations;
    }

    const text = view.state.doc.sliceString(from, to);

    // Match [text](url) links
    const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
    let match;

    while ((match = linkRegex.exec(text)) !== null) {
        const matchFrom = from + match.index;
        const matchTo = matchFrom + match[0].length;
        const linkText = match[1];
        const linkUrl = match[2];

        // Replace entire markdown syntax with widget
        decorations.push(
            Decoration.replace({
                widget: new LinkWidget(linkText, linkUrl),
            }).range(matchFrom, matchTo),
        );
    }

    return decorations;
}
