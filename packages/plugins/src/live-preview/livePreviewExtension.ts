import { syntaxTree } from '@codemirror/language';
import { type Range, RangeSetBuilder } from '@codemirror/state';
import {
    Decoration,
    type DecorationSet,
    type EditorView,
    ViewPlugin,
    type ViewUpdate,
} from '@codemirror/view';
import type { App } from '@inkdown/core';
import { createBoldDecorations } from './decorations/bold';
import { createCalloutDecorations } from './decorations/callout';
import { createCodeBlockDecorations } from './decorations/codeblock';
import { createHeadingDecorations } from './decorations/heading';
import { createHighlightDecorations } from './decorations/highlight';
import { createImageDecorations } from './decorations/image';
import { createItalicDecorations } from './decorations/italic';
import { createLinkDecorations } from './decorations/link';
import { createListDecorations } from './decorations/list';
import { createQuoteDecorations } from './decorations/quote';
import { createStrikethroughDecorations } from './decorations/strikethrough';
import { createTableDecorations } from './decorations/table';
import { createTableNavigationKeymap } from './keymaps/table-navigation';
import './styles/codeblock.css';
import './styles/list.css';
import './styles/image.css';
import './styles/highlight.css';
import './styles/quote.css';
import './styles/callout.css';
import './styles/table.css';

/**
 * Live Preview Extension for CodeMirror
 * Provides WYSIWYG-style rendering of Markdown while editing
 */

class LivePreviewView {
    decorations: DecorationSet;
    filePath?: string;
    app: App;

    constructor(view: EditorView, app: App, filePath?: string) {
        this.app = app;
        this.filePath = filePath;
        this.decorations = this.buildDecorations(view);
    }

    update(update: ViewUpdate) {
        if (update.docChanged || update.viewportChanged || update.selectionSet) {
            this.decorations = this.buildDecorations(update.view);
        }
    }

    buildDecorations(view: EditorView): DecorationSet {
        const allDecorations: Range<Decoration>[] = [];

        // Collect code block background decorations (line decorations)
        const codeBlockBackgrounds = this.getCodeBlockBackgrounds(view);
        allDecorations.push(...codeBlockBackgrounds);

        // Iterate through visible lines and collect other decorations
        for (const { from, to } of view.visibleRanges) {
            let pos = from;
            while (pos <= to) {
                const line = view.state.doc.lineAt(pos);
                const lineFrom = line.from;
                const lineTo = line.to;

                // Collect all decorations for this line
                allDecorations.push(...createHeadingDecorations(view, lineFrom, lineTo));
                allDecorations.push(...createLinkDecorations(view, lineFrom, lineTo));
                allDecorations.push(...createCodeBlockDecorations(view, lineFrom, lineTo));
                allDecorations.push(...createListDecorations(view, lineFrom, lineTo));
                allDecorations.push(...createStrikethroughDecorations(view, lineFrom, lineTo));
                // allDecorations.push(...createHrDecorations(view, lineFrom, lineTo)); // Disabled per user request
                allDecorations.push(...createCalloutDecorations(view, lineFrom, lineTo));
                allDecorations.push(...createBoldDecorations(view, lineFrom, lineTo));
                allDecorations.push(...createItalicDecorations(view, lineFrom, lineTo));
                allDecorations.push(...createHighlightDecorations(view, lineFrom, lineTo));
                allDecorations.push(...createQuoteDecorations(view, lineFrom, lineTo));
                allDecorations.push(...createTableDecorations(view, lineFrom, lineTo));
                allDecorations.push(
                    ...createImageDecorations(view, lineFrom, lineTo, this.app, this.filePath),
                );

                // Move to next line
                if (line.to >= to) break;
                pos = line.to + 1;
            }
        }

        // Sort decorations by position (required by RangeSetBuilder)
        allDecorations.sort((a, b) => {
            // Primary sort: by from position
            if (a.from !== b.from) return a.from - b.from;

            // Secondary sort: by to position
            if (a.to !== b.to) return a.to - b.to;

            // Tertiary sort: line decorations before inline decorations
            // const aIsLine = !!(a.value.spec as any).attributes?.class?.includes('cm-');
            // const bIsLine = !!(b.value.spec as any).attributes?.class?.includes('cm-');

            // Check if it's a Decoration.line() (has class in spec)
            const aHasLineClass = (a.value as any).map?.constructor?.name === 'LineDecoration';
            const bHasLineClass = (b.value as any).map?.constructor?.name === 'LineDecoration';

            if (aHasLineClass && !bHasLineClass) return -1;
            if (!aHasLineClass && bHasLineClass) return 1;

            return 0;
        });

        // Build the decoration set
        const builder = new RangeSetBuilder<Decoration>();
        for (const deco of allDecorations) {
            builder.add(deco.from, deco.to, deco.value);
        }

        return builder.finish();
    }

    /**
     * Get code block background decorations
     * Uses syntaxTree to identify FencedCode nodes and apply line decorations
     */
    getCodeBlockBackgrounds(view: EditorView): Range<Decoration>[] {
        const decorations: Range<Decoration>[] = [];
        const codeBlockLineDeco = Decoration.line({ class: 'cm-codeblock-line' });

        // Iterate through syntax tree to find FencedCode nodes
        syntaxTree(view.state).iterate({
            enter: (node) => {
                if (node.name === 'FencedCode') {
                    const from = node.from;
                    const to = node.to;

                    // Apply line decoration to each line in the code block
                    for (let pos = from; pos <= to; ) {
                        const line = view.state.doc.lineAt(pos);
                        decorations.push(codeBlockLineDeco.range(line.from));

                        if (line.to >= to) break;
                        pos = line.to + 1;
                    }
                }
            },
        });

        return decorations;
    }
}

/**
 * Create the live preview extension
 */
export function livePreviewExtension(app: App, filePath?: string) {
    return [
        ViewPlugin.define((view) => new LivePreviewView(view, app, filePath), {
            decorations: (v) => v.decorations,
        }),
        createTableNavigationKeymap(),
    ];
}
