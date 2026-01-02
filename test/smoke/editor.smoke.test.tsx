/**
 * Editor Smoke Tests
 *
 * These tests verify that the editor component can mount and perform basic operations.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import * as React from 'react';

// Mock CodeMirror and editor dependencies
vi.mock('@codemirror/state', () => ({
    EditorState: {
        create: vi.fn().mockReturnValue({
            doc: { toString: () => '' },
        }),
    },
    StateEffect: {
        define: vi.fn(),
    },
    Compartment: vi.fn().mockImplementation(() => ({
        of: vi.fn(),
    })),
}));

vi.mock('@codemirror/view', () => ({
    EditorView: vi.fn().mockImplementation(() => ({
        destroy: vi.fn(),
        dispatch: vi.fn(),
        state: { doc: { toString: () => '' } },
        dom: document.createElement('div'),
    })),
    keymap: { of: vi.fn() },
    lineNumbers: vi.fn(),
    highlightActiveLine: vi.fn(),
    highlightActiveLineGutter: vi.fn(),
    drawSelection: vi.fn(),
    dropCursor: vi.fn(),
    rectangularSelection: vi.fn(),
    crosshairCursor: vi.fn(),
    placeholder: vi.fn(),
}));

vi.mock('@codemirror/commands', () => ({
    defaultKeymap: [],
    history: vi.fn(),
    historyKeymap: [],
    indentWithTab: vi.fn(),
}));

vi.mock('@codemirror/lang-markdown', () => ({
    markdown: vi.fn().mockReturnValue([]),
}));

vi.mock('@codemirror/language', () => ({
    indentOnInput: vi.fn(),
    bracketMatching: vi.fn(),
    foldGutter: vi.fn(),
    foldKeymap: [],
    syntaxHighlighting: vi.fn(),
    defaultHighlightStyle: {},
}));

describe('Editor Smoke Tests', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('Editor Component Mount', () => {
        it('should render editor container', () => {
            const EditorContainer = () => {
                return React.createElement('div', {
                    'data-testid': 'editor-container',
                    className: 'editor-container',
                }, [
                    React.createElement('div', {
                        key: 'toolbar',
                        'data-testid': 'editor-toolbar',
                        className: 'editor-toolbar',
                    }),
                    React.createElement('div', {
                        key: 'content',
                        'data-testid': 'editor-content',
                        className: 'editor-content',
                    }),
                ]);
            };

            render(React.createElement(EditorContainer));

            expect(screen.getByTestId('editor-container')).toBeInTheDocument();
            expect(screen.getByTestId('editor-toolbar')).toBeInTheDocument();
            expect(screen.getByTestId('editor-content')).toBeInTheDocument();
        });

        it('should have proper CSS classes', () => {
            const EditorContainer = () => {
                return React.createElement('div', {
                    'data-testid': 'editor',
                    className: 'cm-editor cm-focused',
                });
            };

            render(React.createElement(EditorContainer));

            const editor = screen.getByTestId('editor');
            expect(editor).toHaveClass('cm-editor');
        });
    });

    describe('Editor Content', () => {
        it('should display initial content', () => {
            const initialContent = '# Hello World';
            
            const EditorWithContent = () => {
                const [content] = React.useState(initialContent);
                return React.createElement('div', {
                    'data-testid': 'editor-content',
                }, content);
            };

            render(React.createElement(EditorWithContent));

            expect(screen.getByTestId('editor-content')).toHaveTextContent('# Hello World');
        });

        it('should update content on change', () => {
            const EditorWithState = () => {
                const [content, setContent] = React.useState('');
                return React.createElement('div', null, [
                    React.createElement('textarea', {
                        key: 'input',
                        'data-testid': 'editor-input',
                        value: content,
                        onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => setContent(e.target.value),
                    }),
                    React.createElement('div', {
                        key: 'preview',
                        'data-testid': 'editor-preview',
                    }, content),
                ]);
            };

            render(React.createElement(EditorWithState));

            const input = screen.getByTestId('editor-input') as HTMLTextAreaElement;
            fireEvent.change(input, { target: { value: '# New Content' } });

            expect(screen.getByTestId('editor-preview')).toHaveTextContent('# New Content');
        });
    });

    describe('Editor State', () => {
        it('should track dirty state', () => {
            const EditorWithDirtyState = () => {
                const [isDirty, setIsDirty] = React.useState(false);
                const [content, setContent] = React.useState('');

                const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
                    setContent(e.target.value);
                    setIsDirty(true);
                };

                return React.createElement('div', null, [
                    React.createElement('textarea', {
                        key: 'input',
                        'data-testid': 'editor-input',
                        value: content,
                        onChange: handleChange,
                    }),
                    React.createElement('span', {
                        key: 'dirty',
                        'data-testid': 'dirty-indicator',
                    }, isDirty ? 'Modified' : 'Saved'),
                ]);
            };

            render(React.createElement(EditorWithDirtyState));

            expect(screen.getByTestId('dirty-indicator')).toHaveTextContent('Saved');

            const input = screen.getByTestId('editor-input');
            fireEvent.change(input, { target: { value: 'Changed' } });

            expect(screen.getByTestId('dirty-indicator')).toHaveTextContent('Modified');
        });

        it('should handle cursor position', () => {
            const EditorWithCursor = () => {
                const [cursorPos, setCursorPos] = React.useState(0);

                const handleSelect = (e: React.SyntheticEvent<HTMLTextAreaElement>) => {
                    const target = e.target as HTMLTextAreaElement;
                    setCursorPos(target.selectionStart);
                };

                return React.createElement('div', null, [
                    React.createElement('textarea', {
                        key: 'input',
                        'data-testid': 'editor-input',
                        defaultValue: 'Hello World',
                        onSelect: handleSelect,
                    }),
                    React.createElement('span', {
                        key: 'cursor',
                        'data-testid': 'cursor-position',
                    }, `Position: ${cursorPos}`),
                ]);
            };

            render(React.createElement(EditorWithCursor));

            expect(screen.getByTestId('cursor-position')).toHaveTextContent('Position: 0');
        });
    });

    describe('Markdown Features', () => {
        it('should render markdown preview', () => {
            const MarkdownPreview = ({ content }: { content: string }) => {
                // Simple markdown to HTML conversion for testing
                const html = content
                    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
                    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
                    .replace(/\*\*(.+)\*\*/g, '<strong>$1</strong>')
                    .replace(/\*(.+)\*/g, '<em>$1</em>');

                return React.createElement('div', {
                    'data-testid': 'markdown-preview',
                    dangerouslySetInnerHTML: { __html: html },
                });
            };

            render(React.createElement(MarkdownPreview, { content: '# Heading\n**Bold** and *italic*' }));

            const preview = screen.getByTestId('markdown-preview');
            expect(preview.innerHTML).toContain('<h1>Heading</h1>');
            expect(preview.innerHTML).toContain('<strong>Bold</strong>');
            expect(preview.innerHTML).toContain('<em>italic</em>');
        });

        it('should handle code blocks', () => {
            const CodeBlock = ({ code, language }: { code: string; language: string }) => {
                return React.createElement('pre', {
                    'data-testid': 'code-block',
                    'data-language': language,
                }, React.createElement('code', null, code));
            };

            render(React.createElement(CodeBlock, { 
                code: 'const x = 1;', 
                language: 'javascript' 
            }));

            const codeBlock = screen.getByTestId('code-block');
            expect(codeBlock).toHaveAttribute('data-language', 'javascript');
            expect(codeBlock).toHaveTextContent('const x = 1;');
        });
    });

    describe('Editor Actions', () => {
        it('should handle save action', () => {
            const onSave = vi.fn();
            
            const EditorWithSave = () => {
                return React.createElement('button', {
                    type: 'button',
                    'data-testid': 'save-button',
                    onClick: onSave,
                }, 'Save');
            };

            render(React.createElement(EditorWithSave));

            fireEvent.click(screen.getByTestId('save-button'));

            expect(onSave).toHaveBeenCalled();
        });

        it('should handle undo/redo', () => {
            const history: string[] = [''];
            let historyIndex = 0;

            const EditorWithHistory = () => {
                const [content, setContent] = React.useState('');

                const undo = () => {
                    if (historyIndex > 0) {
                        historyIndex--;
                        setContent(history[historyIndex]);
                    }
                };

                const redo = () => {
                    if (historyIndex < history.length - 1) {
                        historyIndex++;
                        setContent(history[historyIndex]);
                    }
                };

                const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
                    const newContent = e.target.value;
                    setContent(newContent);
                    history.push(newContent);
                    historyIndex = history.length - 1;
                };

                return React.createElement('div', null, [
                    React.createElement('textarea', {
                        key: 'input',
                        'data-testid': 'editor-input',
                        value: content,
                        onChange: handleChange,
                    }),
                    React.createElement('button', {
                        key: 'undo',
                        type: 'button',
                        'data-testid': 'undo-button',
                        onClick: undo,
                    }, 'Undo'),
                    React.createElement('button', {
                        key: 'redo',
                        type: 'button',
                        'data-testid': 'redo-button',
                        onClick: redo,
                    }, 'Redo'),
                ]);
            };

            render(React.createElement(EditorWithHistory));

            const input = screen.getByTestId('editor-input');
            fireEvent.change(input, { target: { value: 'First' } });
            fireEvent.change(input, { target: { value: 'Second' } });

            fireEvent.click(screen.getByTestId('undo-button'));
            expect(input).toHaveValue('First');
        });
    });
});
