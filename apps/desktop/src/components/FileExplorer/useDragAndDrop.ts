import { useCallback, useState } from 'react';

export const useDragAndDrop = (
    rootPath: string,
    selectedPaths: Set<string>,
    onMove?: (source: string, destination: string) => Promise<void>,
    onMoveMultiple?: (sources: string[], destination: string) => Promise<void>,
) => {
    const [draggedPaths, setDraggedPaths] = useState<Set<string>>(new Set());
    const [dragOverPath, setDragOverPath] = useState<string | null>(null);

    const handleDragStart = useCallback(
        (e: React.DragEvent, path: string) => {
            const pathsToDrag = selectedPaths.has(path) ? Array.from(selectedPaths) : [path];

            setDraggedPaths(new Set(pathsToDrag));
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('text/plain', JSON.stringify(pathsToDrag));
        },
        [selectedPaths],
    );

    const handleDragEnd = useCallback(() => {
        setDraggedPaths(new Set());
        setDragOverPath(null);
    }, []);

    const handleDragOver = useCallback((e: React.DragEvent, targetPath: string) => {
        e.preventDefault();
        e.stopPropagation();
        e.dataTransfer.dropEffect = 'move';
        setDragOverPath(targetPath);
    }, []);

    const handleDragLeave = useCallback(() => {
        setDragOverPath(null);
    }, []);

    const handleDrop = useCallback(
        async (e: React.DragEvent, targetPath: string) => {
            e.preventDefault();
            e.stopPropagation();
            setDragOverPath(null);

            try {
                const pathsData = e.dataTransfer.getData('text/plain');
                const paths = JSON.parse(pathsData) as string[];

                if (paths.length > 1 && onMoveMultiple) {
                    await onMoveMultiple(paths, targetPath);
                } else if (paths.length === 1 && onMove) {
                    await onMove(paths[0], targetPath);
                }
            } catch (error: any) {
                console.error('Failed to move items:', error);
            }

            setDraggedPaths(new Set());
        },
        [onMove, onMoveMultiple],
    );

    const handleRootDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        e.dataTransfer.dropEffect = 'move';
        setDragOverPath('__root__');
    }, []);

    const handleRootDragLeave = useCallback(() => {
        setDragOverPath(null);
    }, []);

    const handleRootDrop = useCallback(
        async (e: React.DragEvent) => {
            e.preventDefault();
            e.stopPropagation();
            setDragOverPath(null);

            try {
                const pathsData = e.dataTransfer.getData('text/plain');
                const paths = JSON.parse(pathsData) as string[];

                if (paths.length > 1 && onMoveMultiple) {
                    await onMoveMultiple(paths, rootPath);
                } else if (paths.length === 1 && onMove) {
                    await onMove(paths[0], rootPath);
                }
            } catch (error: any) {
                console.error('Failed to move items to root:', error);
            }

            setDraggedPaths(new Set());
        },
        [rootPath, onMove, onMoveMultiple],
    );

    return {
        draggedPaths,
        dragOverPath,
        handleDragStart,
        handleDragEnd,
        handleDragOver,
        handleDragLeave,
        handleDrop,
        handleRootDragOver,
        handleRootDragLeave,
        handleRootDrop,
    };
};
