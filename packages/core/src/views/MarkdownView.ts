import { markdown } from '@codemirror/lang-markdown';
import { languages } from '@codemirror/language-data';
import { EditorState } from '@codemirror/state';
import { EditorView } from '@codemirror/view';
import type { Editor } from '../editor/EditorAdapter';
import { EditorAdapter } from '../editor/EditorAdapter';
import { createMarkdownKeymap } from '../editor/keymaps';
import { createInkdownTheme } from '../editor/theme/codemirror-theme';
import type { TFile } from '../managers/Workspace';
import { TextFileView } from './TextFileView';

/**
 * View for editing Markdown files
 */
export class MarkdownView extends TextFileView {
    editor!: Editor; // The abstract editor interface
    private cmEditor: EditorView | null = null; // The underlying CodeMirror instance

    getViewType(): string {
        return 'markdown';
    }

    getDisplayText(): string {
        return this.file ? this.file.basename : 'Markdown';
    }

    getIcon(): string {
        return 'file-text';
    }

    async onOpen(): Promise<void> {
        // Editor is initialized in onLoadFile
    }

    async onClose(): Promise<void> {
        if (this.cmEditor) {
            this.cmEditor.destroy();
            this.cmEditor = null;
        }
    }

    async onLoadFile(file: TFile): Promise<void> {
        const content = await this.app.workspace.read(file);

        // Initialize editor if not exists
        if (this.cmEditor) {
            this.setViewData(content, true);
        } else {
            this.createEditor(content);
        }
    }

    async onUnloadFile(_file: TFile): Promise<void> {
        // Nothing specific to unload for now
    }

    async save(): Promise<void> {
        if (this.file) {
            const content = this.getViewData();
            await this.app.workspace.modify(this.file, content);
        }
    }

    getViewData(): string {
        return this.cmEditor ? this.cmEditor.state.doc.toString() : '';
    }

    setViewData(data: string, clear: boolean): void {
        if (this.cmEditor) {
            this.cmEditor.dispatch({
                changes: {
                    from: 0,
                    to: this.cmEditor.state.doc.length,
                    insert: data,
                },
            });

            if (clear) {
                // Clear history if needed
            }
        }
    }

    clear(): void {
        this.setViewData('', true);
    }

    private createEditor(content: string): void {
        const startState = EditorState.create({
            doc: content,
            extensions: [
                markdown({ codeLanguages: languages }),
                createInkdownTheme(),
                createMarkdownKeymap(),
                EditorView.updateListener.of((update) => {
                    if (update.docChanged) {
                        // Trigger auto-save or dirty state
                        // For now we just let the app handle it via events
                    }
                }),
                EditorView.theme({
                    '&': { height: '100%' },
                }),
            ],
        });

        this.cmEditor = new EditorView({
            state: startState,
            parent: this.contentEl,
        });

        // Create adapter
        this.editor = new EditorAdapter(this.cmEditor);
    }
}
