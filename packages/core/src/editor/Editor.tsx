import { history, historyKeymap } from '@codemirror/commands';
import { markdown } from '@codemirror/lang-markdown';
import { languages } from '@codemirror/language-data';
import { EditorState, type Extension } from '@codemirror/state';
import { drawSelection, EditorView, keymap } from '@codemirror/view';
import type React from 'react';
import { useEffect, useRef } from 'react';
import type { App, EditorRegistry, ShortcutManager } from '../index';
import {
    createConfigurableExtensions,
    createImagePasteExtension,
    DEFAULT_EDITOR_CONFIG,
    type EditorConfig,
    getReconfigurationEffects,
} from './extensions';
import { createHighlightSyntaxExtension } from './extensions/highlight-syntax';
import { createCustomizableKeymap, createMarkdownKeymap, createSuggestionKeymap } from './keymaps';
import { createInkdownTheme } from './theme/codemirror-theme';

/**
 * Props for the Editor component
 */
export interface EditorProps {
    /** The markdown content to display/edit */
    content: string;
    /** Callback when content changes */
    onChange: (content: string) => void;
    /** Optional file path (used for editor identification) */
    filePath?: string;
    /** Editor registry for managing multiple editor instances */
    editorRegistry: EditorRegistry;
    /** Optional ShortcutManager for customizable keybindings */
    shortcutManager?: ShortcutManager;
    /** App instance for checking plugin states */
    app: App;
    /** Editor configuration for extensions */
    editorConfig?: EditorConfig;
    /** Additional CodeMirror extensions (e.g., from plugins) */
    additionalExtensions?: Extension[];
}

/**
 * Editor Component - CodeMirror 6 based markdown editor
 *
 * Uses CSS variables for theming instead of built-in themes,
 * allowing seamless integration with Inkdown's theme system.
 * Theme changes are handled automatically via CSS variables.
 *
 * @example
 * ```tsx
 * <Editor
 *   content={markdown}
 *   onChange={setMarkdown}
 *   filePath="/path/to/file.md"
 *   editorRegistry={app.editorRegistry}
 * />
 * ```
 */
export const Editor: React.FC<EditorProps> = ({
    content,
    onChange,
    filePath,
    editorRegistry,
    shortcutManager,
    app,
    editorConfig = DEFAULT_EDITOR_CONFIG,
    additionalExtensions = [],
}) => {
    const editorRef = useRef<HTMLDivElement>(null);
    const viewRef = useRef<EditorView | null>(null);
    const isExternalUpdate = useRef(false);
    const onChangeRef = useRef(onChange);
    const editorConfigRef = useRef(editorConfig);

    // Generate a unique ID for this editor instance
    const editorId = useRef(filePath || `editor-${Date.now()}`);

    // Keep onChange ref updated
    useEffect(() => {
        onChangeRef.current = onChange;
    }, [onChange]);

    // Update editor ID when filePath changes
    useEffect(() => {
        if (filePath) {
            editorId.current = filePath;
        }
    }, [filePath]);

    // Reconfigure editor extensions when config changes
    useEffect(() => {
        if (viewRef.current && editorConfigRef.current !== editorConfig) {
            editorConfigRef.current = editorConfig;
            const effects = getReconfigurationEffects(editorConfig);
            viewRef.current.dispatch({ effects });
        }
    }, [editorConfig]);

    // Create editor on mount
    useEffect(() => {
        if (!editorRef.current) return;

        // Cleanup previous view
        if (viewRef.current) {
            viewRef.current.destroy();
            viewRef.current = null;
        }

        // Prepare extensions array
        const baseExtensions = [
            markdown({ codeLanguages: languages }),
            createInkdownTheme(), // Theme now uses CSS variables automatically
            createHighlightSyntaxExtension(), // Highlight ==text== syntax
            // Line wrapping to prevent horizontal overflow
            EditorView.lineWrapping,
            // Draw selection is required for vim visual mode to render correctly
            drawSelection(),
            // History for undo/redo (Ctrl+Z, Ctrl+Shift+Z)
            history(),
            keymap.of(historyKeymap),
            // Configurable extensions (auto-pair brackets, tab indentation, etc.)
            ...createConfigurableExtensions(editorConfig),
            // Image paste extension (saves pasted images and inserts markdown)
            createImagePasteExtension(app),
            // Use customizable keymap if ShortcutManager is provided, otherwise use defaults
            shortcutManager ? createCustomizableKeymap(shortcutManager) : createMarkdownKeymap(),
            createSuggestionKeymap(app),
            // Additional extensions from plugins
            ...additionalExtensions,
            EditorView.updateListener.of((update) => {
                if (update.docChanged && !isExternalUpdate.current) {
                    onChangeRef.current(update.state.doc.toString());
                }
                // Notify app of editor updates (for plugins like EditorSuggest)
                app.handleEditorUpdate(update);
            }),
            // Additional theme customization
            EditorView.theme({
                '&': {
                    height: '100%',
                },
            }),
        ];

        // Create editor state with syntax highlighting and keymaps
        const startState = EditorState.create({
            doc: content,
            extensions: baseExtensions,
        });

        // Create editor view
        const view = new EditorView({
            state: startState,
            parent: editorRef.current,
        });

        viewRef.current = view;

        // Register editor with the registry
        editorRegistry.register(editorId.current, view);
        editorRegistry.setActive(editorId.current);

        return () => {
            // Unregister from registry before destroying
            editorRegistry.unregister(editorId.current);
            view.destroy();
            viewRef.current = null;
        };
    }, [editorRegistry, shortcutManager, additionalExtensions, app, content, editorConfig]); // Theme changes handled via CSS variables

    // Update content when it changes externally (e.g., switching tabs)
    useEffect(() => {
        if (viewRef.current) {
            const currentContent = viewRef.current.state.doc.toString();
            if (currentContent !== content) {
                isExternalUpdate.current = true;

                // Save current cursor position
                const currentSelection = viewRef.current.state.selection.main;
                const cursorPos = currentSelection.head;

                viewRef.current.dispatch({
                    changes: {
                        from: 0,
                        to: viewRef.current.state.doc.length,
                        insert: content,
                    },
                    // Preserve cursor position if it's still valid in the new content
                    selection: {
                        anchor: Math.min(cursorPos, content.length),
                        head: Math.min(cursorPos, content.length),
                    },
                });

                isExternalUpdate.current = false;
            }
        }
    }, [content]);

    return (
        <div className="editor-container">
            <div ref={editorRef} className="editor-wrapper" />
        </div>
    );
};
