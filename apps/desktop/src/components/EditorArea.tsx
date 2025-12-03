import React, { memo, useCallback } from 'react';
import { Editor } from '@inkdown/core';
import type { EditorConfig } from '@inkdown/core';
import { EmptyTabView, Preview } from '@inkdown/ui';
import type { ViewMode } from '../hooks/useEditorSettings';

interface EditorAreaProps {
    activeTab: { id: string; filePath: string; label: string } | null;
    editorContent: string;
    viewMode: ViewMode;
    editorConfig: EditorConfig;
    isLoadingContent: boolean;
    onEditorChange: (value: string) => void;
    onSave: () => Promise<void>;
}

export const EditorArea = memo<EditorAreaProps>(({
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
        [onSave]
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
                <Preview content={editorContent} />
            ) : viewMode === 'editor' ? (
                <Editor
                    key={activeTab.id}
                    value={editorContent}
                    onChange={onEditorChange}
                    config={editorConfig}
                />
            ) : (
                <div className="editor-split">
                    <div className="editor-pane">
                        <Editor
                            key={activeTab.id}
                            value={editorContent}
                            onChange={onEditorChange}
                            config={editorConfig}
                        />
                    </div>
                    <div className="preview-pane">
                        <Preview content={editorContent} />
                    </div>
                </div>
            )}
        </div>
    );
});

EditorArea.displayName = 'EditorArea';
