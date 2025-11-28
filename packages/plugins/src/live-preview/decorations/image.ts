import type { Range } from '@codemirror/state';
import type { EditorView } from '@codemirror/view';
import { Decoration, WidgetType } from '@codemirror/view';
import { shouldDecorate } from '../utils/selection';

/**
 * Create decorations for images (![alt](url))
 * Hides the markdown syntax and displays the image
 */
export function createImageDecorations(
    view: EditorView,
    from: number,
    to: number,
): Range<Decoration>[] {
    const decorations: Range<Decoration>[] = [];

    if (!shouldDecorate(view, from, to)) {
        return decorations;
    }

    const text = view.state.doc.sliceString(from, to);

    // Match images: ![alt](url)
    const imageRegex = /!\[(.*?)\]\((.*?)\)/g;
    let match;

    while ((match = imageRegex.exec(text)) !== null) {
        const matchFrom = from + match.index;
        const matchTo = matchFrom + match[0].length;
        const altText = match[1];
        const url = match[2];

        decorations.push(
            Decoration.replace({
                widget: new ImageWidget(url, altText),
                block: false, // Inline replacement, but widget is block-level via CSS
            }).range(matchFrom, matchTo),
        );
    }

    return decorations;
}

class ImageWidget extends WidgetType {
    constructor(
        private url: string,
        private alt: string,
    ) {
        super();
    }

    toDOM() {
        const container = document.createDiv({ cls: 'cm-image-widget' });

        const img = container.createEl('img', {
            attr: {
                src: this.url,
                alt: this.alt,
                title: this.alt,
            },
        });

        // Handle loading errors
        img.onerror = () => {
            container.setText(`❌ Failed to load image: ${this.alt || 'Image'}`);
            container.style.color = 'var(--text-muted)';
            container.style.padding = '8px';
            container.style.border = '1px dashed var(--border-color)';
        };

        return container;
    }

    ignoreEvent() {
        return false;
    }
}
