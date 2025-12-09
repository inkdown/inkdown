import { HighlightStyle, syntaxHighlighting } from '@codemirror/language';
import type { Extension } from '@codemirror/state';
import { EditorView } from '@codemirror/view';
import { tags as t } from '@lezer/highlight';

/**
 * Create Inkdown's custom CodeMirror theme using CSS variables
 *
 * This theme system reads all colors from CSS variables, allowing complete
 * customization through themes without touching TypeScript code.
 */
export function createInkdownTheme(): Extension {
    // Base editor theme using CSS variables
    const theme = EditorView.theme({
        '&': {
            color: 'var(--editor-fg)',
            backgroundColor: 'var(--editor-bg)',
            fontSize: 'var(--font-size-editor, 16px)',
            fontFamily: 'var(--font-family)',
            lineHeight: 'var(--line-height-editor, 1.6)',
        },
        '.cm-content': {
            caretColor: 'var(--editor-cursor)',
            padding: '16px 0',
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
            paddingRight: '8px',
        },
        '.cm-activeLineGutter': {
            backgroundColor: 'var(--editor-active-line)',
            color: 'var(--editor-line-number)',
        },
        '.cm-lineNumbers .cm-gutterElement': {
            padding: '0 8px 0 0',
            minWidth: '32px',
        },
        '.cm-line': {
            padding: '0 16px',
        },
        // Vim mode styles
        '.cm-vim-panel': {
            backgroundColor: 'var(--bg-secondary, #252526)',
            color: 'var(--text-primary, #e0e0e0)',
            padding: '4px 8px',
            fontFamily: 'var(--font-family-mono, monospace)',
            fontSize: '0.9em',
        },
        '.cm-vim-panel input': {
            backgroundColor: 'transparent',
            color: 'inherit',
            border: 'none',
            outline: 'none',
            fontFamily: 'inherit',
        },
        // Vim fat cursor for normal mode
        '&.cm-focused .cm-fat-cursor': {
            backgroundColor: 'var(--editor-cursor, #e0e0e0)',
            color: 'var(--editor-bg, #1e1e1e)',
        },
        '.cm-fat-cursor': {
            backgroundColor: 'var(--editor-cursor, #e0e0e0) !important',
            color: 'var(--editor-bg, #1e1e1e) !important',
        },
        // Vim visual mode selection
        '& .cm-selectionMatch': {
            backgroundColor: 'var(--editor-selection)',
        },
    });

    // Syntax highlighting using CSS variables
    // All colors are read from CSS variables, making themes fully customizable
    const highlightStyle = HighlightStyle.define([
        // Headings
        {
            tag: t.heading1,
            fontSize: 'var(--heading-h1-size)',
            fontWeight: 'var(--heading-font-weight)',
            color: 'var(--heading-h1)',
        },
        {
            tag: t.heading2,
            fontSize: 'var(--heading-h2-size)',
            fontWeight: 'var(--heading-font-weight)',
            color: 'var(--heading-h2)',
        },
        {
            tag: t.heading3,
            fontSize: 'var(--heading-h3-size)',
            fontWeight: 'var(--heading-font-weight)',
            color: 'var(--heading-h3)',
        },
        {
            tag: t.heading4,
            fontSize: 'var(--heading-h4-size)',
            fontWeight: 'var(--heading-font-weight)',
            color: 'var(--heading-h4)',
        },
        {
            tag: t.heading5,
            fontSize: 'var(--heading-h5-size)',
            fontWeight: 'var(--heading-font-weight)',
            color: 'var(--heading-h5)',
        },
        {
            tag: t.heading6,
            fontSize: 'var(--heading-h6-size)',
            fontWeight: 'var(--heading-font-weight)',
            color: 'var(--heading-h6)',
        },

        // Text formatting
        { tag: t.emphasis, fontStyle: 'italic', color: 'var(--syntax-emphasis)' },
        { tag: t.strong, fontWeight: 'bold', color: 'var(--syntax-strong)' },
        { tag: t.strikethrough, textDecoration: 'line-through', color: 'var(--syntax-strikethrough)' },
        { tag: t.link, color: 'var(--syntax-link)', textDecoration: 'underline' },
        { tag: t.url, color: 'var(--syntax-url)' },

        // Inline code
        {
            tag: t.monospace,
            fontFamily: 'var(--font-family-mono, "JetBrains Mono", monospace)',
            backgroundColor: 'var(--code-bg)',
            color: 'var(--syntax-monospace)',
            padding: 'var(--code-padding)',
            borderRadius: 'var(--code-border-radius)',
            fontSize: 'var(--code-font-size)',
        },

        // Quote
        {
            tag: t.quote,
            color: 'var(--syntax-quote)',
            fontStyle: 'italic',
        },

        // List
        { tag: t.list, color: 'var(--syntax-list)' },

        // Meta (markdown formatting characters)
        { tag: t.meta, color: 'var(--cm-meta)' },

        // Code syntax highlighting (for code blocks)
        { tag: t.comment, color: 'var(--cm-comment)', fontStyle: 'italic' },
        { tag: t.keyword, color: 'var(--cm-keyword)' },
        { tag: t.operator, color: 'var(--cm-operator)' },
        { tag: t.variableName, color: 'var(--cm-variable)' },
        { tag: t.typeName, color: 'var(--cm-type)' },
        { tag: t.string, color: 'var(--cm-string)' },
        { tag: t.number, color: 'var(--cm-number)' },
        { tag: t.bool, color: 'var(--cm-bool)' },
        { tag: t.null, color: 'var(--cm-null)' },
        { tag: t.atom, color: 'var(--cm-bool)' },
        { tag: t.propertyName, color: 'var(--cm-property)' },
        { tag: t.function(t.variableName), color: 'var(--cm-function)' },
        { tag: t.className, color: 'var(--cm-type)' },
        { tag: t.tagName, color: 'var(--cm-tag)' },
        { tag: t.attributeName, color: 'var(--cm-attribute)' },
        { tag: t.attributeValue, color: 'var(--cm-string)' },
        { tag: t.regexp, color: 'var(--cm-regexp)' },
        { tag: t.punctuation, color: 'var(--cm-punctuation)' },
        { tag: t.invalid, color: 'var(--cm-keyword)', textDecoration: 'underline wavy' },
    ]);

    return [theme, syntaxHighlighting(highlightStyle)];
}
