import type { App, EditorConfig } from '@inkdown/core';
import { Editor } from '@inkdown/core';
import { EmptyTabView } from '@inkdown/ui';
import type React from 'react';
import { memo, useCallback } from 'react';
import type { ViewMode } from '../hooks/useEditorSettings';
import { Preview } from './Preview';

interface EditorAreaProps {
    app: App;
    activeTab: { id: string; filePath: string; label: string } | null;
    editorContent: string;
    viewMode: ViewMode;
    editorConfig: EditorConfig;
    isLoadingContent: boolean;
    onEditorChange: (value: string) => void;
    onSave: () => Promise<void>;
}

export const EditorArea = memo<EditorAreaProps>(
    ({
        app,
        activeTab,
        editorContent,
        viewMode,
        editorConfig,
        isLoadingContent,
        onEditorChange,
        onSave,
    }) => {
        const handleKeyDown = useCallback(
            async (e: React.KeyboardEvent) => {
                // Save: Ctrl/Cmd + S
                if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                    e.preventDefault();
                    await onSave();
                }
            },
            [onSave],
        );

        if (!activeTab) {
            return (
                <div className="editor-area">
                    <EmptyTabView />
                </div>
            );
        }

        if (isLoadingContent) {
            return (
                <div className="editor-area">
                    <div className="editor-loading">Loading...</div>
                </div>
            );
        }

        return (
            <div className="editor-area" onKeyDown={handleKeyDown}>
                {viewMode === 'preview' ? (
                    <Preview
                        content={editorContent}
                        mode="preview-only"
                        app={app}
                        currentFilePath={activeTab.filePath}
                    />
                ) : viewMode === 'editor' ? (
                    <Editor
                        key={activeTab.id}
                        content={editorContent}
                        onChange={onEditorChange}
                        editorConfig={editorConfig}
                        app={app}
                        editorRegistry={app.editorRegistry}
                    />
                ) : (
                    <div className="editor-split">
                        <div className="editor-pane">
                            <Editor
                                key={activeTab.id}
                                content={editorContent}
                                onChange={onEditorChange}
                                editorConfig={editorConfig}
                                app={app}
                                editorRegistry={app.editorRegistry}
                            />
                        </div>
                        <div className="preview-pane">
                            <Preview
                                content={editorContent}
                                mode="side-by-side"
                                app={app}
                                currentFilePath={activeTab.filePath}
                            />
                        </div>
                    </div>
                )}
            </div>
        );
    },
);

EditorArea.displayName = 'EditorArea';
