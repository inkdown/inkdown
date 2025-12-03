import { useCallback, useState } from 'react';
import type { FileNode } from '@inkdown/core';

export const useFileNodeInteractions = (
    setExpandedDirs: React.Dispatch<React.SetStateAction<Set<string>>>,
    setExpandingDirs: React.Dispatch<React.SetStateAction<Set<string>>>,
    onExpandedDirsChange?: (expandedDirs: string[]) => void,
    onFileSelect?: (filePath: string, openInNewTab?: boolean) => void
) => {
    const [lastClickTime, setLastClickTime] = useState<number>(0);
    const [lastClickPath, setLastClickPath] = useState<string | null>(null);

    const toggleDirectory = useCallback(
        (path: string) => {
            setExpandedDirs((prev) => {
                const newExpanded = new Set(prev);
                
                if (newExpanded.has(path)) {
                    newExpanded.delete(path);
                } else {
                    newExpanded.add(path);
                    // Mark as expanding for animation
                    setExpandingDirs((prevExpanding) => {
                        const newExpanding = new Set(prevExpanding);
                        newExpanding.add(path);
                        return newExpanding;
                    });

                    // Remove expanding state after animation
                    setTimeout(() => {
                        setExpandingDirs((prevExpanding) => {
                            const newExpanding = new Set(prevExpanding);
                            newExpanding.delete(path);
                            return newExpanding;
                        });
                    }, 250);
                }

                // Persist expanded state
                onExpandedDirsChange?.(Array.from(newExpanded));
                return newExpanded;
            });
        },
        [onExpandedDirsChange, setExpandedDirs, setExpandingDirs]
    );

    const handleItemClick = useCallback(
        (node: FileNode, e: React.MouseEvent) => {
            const now = Date.now();
            const isDoubleClick = now - lastClickTime < 300 && lastClickPath === node.path;

            if (node.isDirectory) {
                if (isDoubleClick || e.detail === 2) {
                    // Double-click: toggle directory
                    toggleDirectory(node.path);
                }
            } else {
                // File: open
                onFileSelect?.(node.path, e.ctrlKey || e.metaKey);
            }

            setLastClickTime(now);
            setLastClickPath(node.path);
        },
        [lastClickTime, lastClickPath, toggleDirectory, onFileSelect]
    );

    return {
        handleItemClick,
        toggleDirectory,
    };
};
