import { useCallback, useEffect, useRef, useState } from 'react';
import { useApp } from '../contexts/AppContext';

interface UseEditorStateReturn {
    /** Current editor content */
    content: string;
    /** Whether content is being loaded */
    isLoading: boolean;
    /** Update content (triggers auto-save) */
    updateContent: (content: string) => void;
    /** Force save immediately */
    saveNow: () => Promise<void>;
    /** Whether there are unsaved changes */
    isDirty: boolean;
}

/**
 * Hook for managing editor content state.
 * Integrates with EditorStateManager for caching and auto-save.
 *
 * @param filePath - The file path to manage state for
 */
export function useEditorState(filePath: string | undefined): UseEditorStateReturn {
    const app = useApp();
    const [content, setContent] = useState<string>('');
    const [isLoading, setIsLoading] = useState(false);
    const [isDirty, setIsDirty] = useState(false);
    const currentFileRef = useRef<string | undefined>(filePath);

    // Load content when file path changes
    useEffect(() => {
        if (!filePath) {
            setContent('');
            setIsDirty(false);
            return;
        }

        // Track current file to prevent race conditions
        currentFileRef.current = filePath;

        const loadContent = async () => {
            setIsLoading(true);

            try {
                // Try to get from cache first
                const cached = app.editorStateManager.getCachedContent(filePath);

                if (cached !== undefined) {
                    setContent(cached);
                    setIsDirty(app.editorStateManager.isDirty(filePath));
                } else {
                    // Load from file system via EditorStateManager (handles caching)
                    const fileContent = await app.editorStateManager.getContent(filePath);

                    // Only update if this is still the current file
                    if (currentFileRef.current === filePath) {
                        setContent(fileContent);
                        setIsDirty(false);
                    }
                }
            } catch (error) {
                console.error('Failed to load content:', error);
                if (currentFileRef.current === filePath) {
                    setContent('');
                }
            } finally {
                if (currentFileRef.current === filePath) {
                    setIsLoading(false);
                }
            }
        };

        loadContent();
    }, [filePath, app]);

    // Update content handler
    const updateContent = useCallback(
        (newContent: string) => {
            setContent(newContent);
            setIsDirty(true);

            if (filePath) {
                // Update cache and trigger auto-save
                app.editorStateManager.updateContent(filePath, newContent);
            }
        },
        [filePath, app],
    );

    // Save immediately
    const saveNow = useCallback(async () => {
        if (!filePath || !isDirty) return;

        try {
            await app.editorStateManager.saveFile(filePath);
            setIsDirty(false);
        } catch (error) {
            console.error('Failed to save file:', error);
            throw error;
        }
    }, [filePath, isDirty, app]);

    return {
        content,
        isLoading,
        updateContent,
        saveNow,
        isDirty,
    };
}
