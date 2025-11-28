/**
 * @inkdown/core/editor
 *
 * CodeMirror 6 based markdown editor for Inkdown.
 * Now part of @inkdown/core for simplified architecture.
 *
 * @example
 * ```tsx
 * import { Editor } from '@inkdown/core';
 *
 * function App() {
 *   const [content, setContent] = useState('');
 *   return <Editor content={content} onChange={setContent} />;
 * }
 * ```
 */

export type { EditorState } from '@codemirror/state';
// Re-export useful CodeMirror types for consumers
export type { EditorView } from '@codemirror/view';
// Editor commands
export * from './commands';
export type { EditorProps } from './Editor';
// Editor component
export { Editor } from './Editor';
// Editor abstraction (for plugins)
export type {
    Editor as IEditor,
    EditorPosition,
    EditorRange,
    EditorTransaction,
} from './EditorAdapter';
export { EditorAdapter } from './EditorAdapter';
// Keymaps
export {
    createCustomizableKeymap,
    createMarkdownKeymap,
    EDITOR_COMMANDS,
    executeEditorCommand,
    getEditorCommand,
    registerEditorCommands,
} from './keymaps';
// CodeMirror theme
export { createInkdownTheme } from './theme/codemirror-theme';
