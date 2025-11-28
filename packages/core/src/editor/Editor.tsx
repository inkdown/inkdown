import { markdown } from '@codemirror/lang-markdown';
import { languages } from '@codemirror/language-data';
import { EditorState } from '@codemirror/state';
import { EditorView } from '@codemirror/view';
import type React from 'react';
import { useEffect, useRef } from 'react';
import type { App, EditorRegistry, ShortcutManager } from '../index';
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
}) => {
    const editorRef = useRef<HTMLDivElement>(null);
    const viewRef = useRef<EditorView | null>(null);
    const isExternalUpdate = useRef(false);
    const onChangeRef = useRef(onChange);

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

    // Create editor on mount
    useEffect(() => {
        if (!editorRef.current) return;

        // Cleanup previous view
        if (viewRef.current) {
            viewRef.current.destroy();
            viewRef.current = null;
        }

        // Create editor state with syntax highlighting and keymaps
        const startState = EditorState.create({
            doc: content,
            extensions: [
                markdown({ codeLanguages: languages }),
                createInkdownTheme(), // Theme now uses CSS variables automatically
                // Live Preview is now optional - can be added via plugin if needed
                // Use customizable keymap if ShortcutManager is provided, otherwise use defaults
                // Use customizable keymap if ShortcutManager is provided, otherwise use defaults
                shortcutManager
                    ? createCustomizableKeymap(shortcutManager)
                    : createMarkdownKeymap(),
                createSuggestionKeymap(app),
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
            ],
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
    }, [editorRegistry, shortcutManager]); // Theme changes handled via CSS variables

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
