import { HighlightStyle, syntaxHighlighting } from '@codemirror/language';
import type { Extension } from '@codemirror/state';
import { EditorView } from '@codemirror/view';
import { tags as t } from '@lezer/highlight';

/**
 * Creates a CodeMirror theme that uses CSS variables for syntax highlighting.
 * This allows the theme to be controlled by the global Inkdown theme system.
 *
 * - Seamless theme switching without editor recreation
 * - Community theme compatibility
 * - Consistent styling across the application
 *
 * @returns CodeMirror extension array for theming
 *
 * @example
 * ```ts
 * const extensions = [
 *   markdown(),
 *   createInkdownTheme(),
 * ];
 * ```
 */
export function createInkdownTheme(): Extension {
    // Define syntax highlighting using Lezer tags
    // Maps parser tags to CSS classes/styles
    const highlightStyle = HighlightStyle.define([
        // Headings
        { tag: t.heading1, class: 'cm-heading-1' },
        { tag: t.heading2, class: 'cm-heading-2' },
        { tag: t.heading3, class: 'cm-heading-3' },
        { tag: t.heading4, class: 'cm-heading-4' },
        { tag: t.heading5, class: 'cm-heading-5' },
        { tag: t.heading6, class: 'cm-heading-6' },

        // Text formatting
        { tag: t.strong, class: 'cm-strong' },
        { tag: t.emphasis, class: 'cm-em' },
        { tag: t.strikethrough, class: 'cm-strikethrough' },

        // Links
        { tag: t.link, class: 'cm-link' },
        { tag: t.url, class: 'cm-url' },

        // Code
        { tag: t.monospace, class: 'cm-inline-code' },
        { tag: t.processingInstruction, class: 'cm-code-block' },

        // Markdown formatting marks (should not have backgrounds)
        { tag: t.meta, class: 'cm-formatting' },

        // Lists
        { tag: t.list, class: 'cm-list' },

        // Quotes
        { tag: t.quote, class: 'cm-quote' },

        // Code block syntax highlighting
        { tag: t.keyword, class: 'cm-keyword' },
        { tag: t.string, class: 'cm-string' },
        { tag: t.comment, class: 'cm-comment' },
        { tag: t.variableName, class: 'cm-variableName' },
        { tag: t.function(t.variableName), class: 'cm-function' },
        { tag: t.propertyName, class: 'cm-propertyName' },
        { tag: t.typeName, class: 'cm-typeName' },
        { tag: t.className, class: 'cm-className' },
        { tag: t.number, class: 'cm-number' },
        { tag: t.operator, class: 'cm-operator' },
        { tag: t.bool, class: 'cm-bool' },
        { tag: t.atom, class: 'cm-atom' },
        { tag: t.regexp, class: 'cm-regexp' },
        { tag: t.meta, class: 'cm-meta' },
        { tag: t.punctuation, class: 'cm-punctuation' },
        { tag: t.bracket, class: 'cm-bracket' },
        { tag: t.tagName, class: 'cm-tagName' },
        { tag: t.attributeName, class: 'cm-attributeName' },
        { tag: t.attributeValue, class: 'cm-attributeValue' },

        // Separators
        { tag: t.contentSeparator, class: 'cm-hr' },
    ]);

    // Base editor theme using CSS variables
    const baseTheme = EditorView.theme({
        '&': {
            backgroundColor: 'var(--editor-bg)',
            color: 'var(--editor-fg)',
        },
        '.cm-content': {
            caretColor: 'var(--editor-cursor)',
            fontFamily: 'var(--font-family)',
            fontSize: 'var(--font-size-editor)',
            lineHeight: 'var(--line-height-base)',
        },
        '.cm-cursor, .cm-dropCursor': {
            borderLeftColor: 'var(--editor-cursor)',
        },
        '&.cm-focused .cm-selectionBackground, .cm-selectionBackground, .cm-content ::selection': {
            backgroundColor: 'var(--editor-selection)',
        },
        '.cm-activeLine': {
            backgroundColor: 'var(--editor-active-line)',
        },
        '.cm-gutters': {
            backgroundColor: 'var(--editor-bg)',
            color: 'var(--editor-line-number)',
            border: 'none',
        },
        '.cm-activeLineGutter': {
            backgroundColor: 'var(--editor-active-line)',
        },
    });

    return [baseTheme, syntaxHighlighting(highlightStyle)];
}
