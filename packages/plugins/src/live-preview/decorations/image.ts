import type { Range } from '@codemirror/state';
import type { EditorView } from '@codemirror/view';
import { Decoration, WidgetType } from '@codemirror/view';
import type { App } from '@inkdown/core';
import { convertFileToDataUrl, resolveImagePath } from '../utils/imageLoader';
import { shouldDecorate } from '../utils/selection';

/**
 * Create decorations for images (![alt](url))
 * Hides the markdown syntax and displays the image
 */
export function createImageDecorations(
    view: EditorView,
    from: number,
    to: number,
    app: App,
    currentFilePath?: string,
): Range<Decoration>[] {
    const decorations: Range<Decoration>[] = [];

    if (!shouldDecorate(view, from, to)) {
        return decorations;
    }

    const text = view.state.doc.sliceString(from, to);

    // Match images: ![alt](url)
    const imageRegex = /!\[(.*?)\]\((.*?)\)/g;
    let match;

    match = imageRegex.exec(text);
    while (match !== null) {
        const matchFrom = from + match.index;
        const matchTo = matchFrom + match[0].length;
        const altText = match[1];
        const url = match[2];

        decorations.push(
            Decoration.replace({
                widget: new ImageWidget(url, altText, app, currentFilePath),
                block: false,
            }).range(matchFrom, matchTo),
        );
        match = imageRegex.exec(text);
    }

    return decorations;
}

class ImageWidget extends WidgetType {
    constructor(
        private url: string,
        private alt: string,
        private app: App,
        private currentFilePath?: string,
    ) {
        super();
    }

    toDOM() {
        const container = document.createDiv({ cls: 'cm-image-widget' });

        // Check if it's a remote URL
        const isRemoteUrl = this.url.match(/^(https?|data):/i);

        if (isRemoteUrl) {
            // Remote URL or data URL - use directly
            this.createImage(container, this.url);
        } else if (this.currentFilePath) {
            // Local file - resolve path and load via Inkdown FileSystemManager
            const resolvedPath = resolveImagePath(this.url, this.currentFilePath);

            console.log('[ImageWidget] Loading local image:', {
                originalUrl: this.url,
                currentFilePath: this.currentFilePath,
                resolvedPath,
            });

            // Show loading state
            container.setText('📷 Loading...');
            container.style.color = 'var(--text-muted)';
            container.style.padding = '8px';

            // Load image asynchronously via FileSystemManager
            convertFileToDataUrl(this.app, resolvedPath)
                .then((dataUrl) => {
                    console.log('[ImageWidget] Image loaded successfully');
                    // Clear loading text and create image
                    container.empty();
                    this.createImage(container, dataUrl);
                })
                .catch((error) => {
                    console.error('[ImageWidget] Failed to load image:', error);
                    container.empty();
                    container.setText(`❌ Failed to load: ${this.url}`);
                    container.style.color = 'var(--text-error)';
                    container.style.padding = '8px';
                    container.style.border = '1px dashed var(--border-color)';
                });
        } else {
            // No context - show error
            container.setText(`⚠️ No file context for: ${this.url}`);
            container.style.color = 'var(--text-muted)';
            container.style.padding = '8px';
        }

        return container;
    }

    private createImage(container: HTMLElement, src: string) {
        const img = container.createEl('img', {
            attr: {
                src: src,
                alt: this.alt,
                title: this.alt,
            },
        });

        img.onerror = () => {
            console.error('[ImageWidget] Image element failed to load:', src);
            container.empty();
            container.setText(`❌ Failed to display: ${this.alt}`);
            container.style.color = 'var(--text-error)';
            container.style.padding = '8px';
            container.style.border = '1px dashed var(--border-color)';
        };
    }

    ignoreEvent() {
        return false;
    }
}
