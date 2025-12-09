import { RangeSetBuilder } from '@codemirror/state';
import {
    Decoration,
    type DecorationSet,
    EditorView,
    ViewPlugin,
    type ViewUpdate,
} from '@codemirror/view';

/**
 * Extension to highlight ==text== syntax in the raw editor
 * Adds visual background color to text between == markers
 */

const highlightMark = Decoration.mark({
    class: 'cm-highlight-syntax',
});

function getHighlightDecorations(view: EditorView): DecorationSet {
    const builder = new RangeSetBuilder<Decoration>();
    
    for (const { from, to } of view.visibleRanges) {
        const text = view.state.doc.sliceString(from, to);
        const regex = /==((?:[^=]|=[^=])+?)==/g;
        let match;
        
        while ((match = regex.exec(text)) !== null) {
            const start = from + match.index;
            const end = start + match[0].length;
            
            // Add decoration to the entire match including markers
            builder.add(start, end, highlightMark);
        }
    }
    
    return builder.finish();
}

const highlightSyntaxPlugin = ViewPlugin.fromClass(
    class {
        decorations: DecorationSet;

        constructor(view: EditorView) {
            this.decorations = getHighlightDecorations(view);
        }

        update(update: ViewUpdate) {
            if (update.docChanged || update.viewportChanged) {
                this.decorations = getHighlightDecorations(update.view);
            }
        }
    },
    {
        decorations: (v) => v.decorations,
    }
);

export function createHighlightSyntaxExtension() {
    return [
        highlightSyntaxPlugin,
        EditorView.baseTheme({
            '.cm-highlight-syntax': {
                backgroundColor: 'var(--text-highlight-bg)',
                borderRadius: '2px',
            },
        }),
    ];
}
