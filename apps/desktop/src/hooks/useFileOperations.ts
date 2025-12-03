import { useCallback } from 'react';
import type { App } from '@inkdown/core';
import { writeText } from '@tauri-apps/plugin-clipboard-manager';
import { ask, open as openDialog } from '@tauri-apps/plugin-dialog';
import { revealItemInDir } from '@tauri-apps/plugin-opener';
import type { SelectedItem } from '../components/FileExplorer';

export const useFileOperations = (
    app: App,
    rootPath: string,
    onFileSelect?: (filePath: string, openInNewTab?: boolean) => Promise<void>
) => {
    const handleCreateFile = useCallback(
        async (parentPath: string) => {
            try {
                await app.fileSystemManager.createFile(parentPath);
            } catch (error) {
                console.error('Failed to create file:', error);
            }
        },
        [app]
    );

    const handleCreateDirectory = useCallback(
        async (parentPath: string) => {
            try {
                await app.fileSystemManager.createDirectory(parentPath);
            } catch (error) {
                console.error('Failed to create directory:', error);
            }
        },
        [app]
    );

    const handleRename = useCallback(
        async (oldPath: string, newName: string) => {
            try {
                await app.fileSystemManager.rename(oldPath, newName);
            } catch (error) {
                console.error('Failed to rename:', error);
            }
        },
        [app]
    );

    const handleDelete = useCallback(
        async (path: string, isDirectory: boolean) => {
            try {
                await app.fileSystemManager.delete(path, isDirectory);
            } catch (error) {
                console.error('Failed to delete:', error);
            }
        },
        [app]
    );

    const handleDeleteMultiple = useCallback(
        async (paths: Array<{ path: string; isDirectory: boolean }>) => {
            try {
                for (const { path, isDirectory } of paths) {
                    await app.fileSystemManager.delete(path, isDirectory);
                }
            } catch (error) {
                console.error('Failed to delete multiple items:', error);
            }
        },
        [app]
    );

    const handleMove = useCallback(
        async (source: string, destination: string) => {
            try {
                await app.fileSystemManager.move(source, destination);
            } catch (error) {
                console.error('Failed to move:', error);
            }
        },
        [app]
    );

    const handleMoveMultiple = useCallback(
        async (sources: string[], destination: string) => {
            try {
                for (const source of sources) {
                    await app.fileSystemManager.move(source, destination);
                }
            } catch (error) {
                console.error('Failed to move multiple items:', error);
            }
        },
        [app]
    );

    const handleRequestDeleteConfirm = useCallback(
        async (items: SelectedItem[]): Promise<boolean> => {
            const count = items.length;
            const isDirectory = items.some((item) => item.isDirectory);

            let message: string;
            if (count === 1) {
                const item = items[0];
                message = isDirectory
                    ? `Are you sure you want to delete the folder "${item.name}" and all its contents?`
                    : `Are you sure you want to delete "${item.name}"?`;
            } else {
                message = `Are you sure you want to delete ${count} items?`;
            }

            const confirmed = await ask(message, {
                title: 'Confirm Delete',
                kind: 'warning',
            });

            return confirmed;
        },
        []
    );

    const handleCopyFile = useCallback(
        async (sourcePath: string) => {
            try {
                await app.fileSystemManager.copyFile(sourcePath);
            } catch (error) {
                console.error('Failed to copy file:', error);
            }
        },
        [app]
    );

    const handleCopyPath = useCallback(async (path: string) => {
        try {
            await writeText(path);
        } catch (error) {
            console.error('Failed to copy path:', error);
        }
    }, []);

    const handleCopyRelativePath = useCallback(
        async (path: string) => {
            try {
                const relativePath = path.replace(rootPath + '/', '');
                await writeText(relativePath);
            } catch (error) {
                console.error('Failed to copy relative path:', error);
            }
        },
        [rootPath]
    );

    const handleShowInExplorer = useCallback(async (path: string) => {
        try {
            await revealItemInDir(path);
        } catch (error) {
            console.error('Failed to show in explorer:', error);
        }
    }, []);

    const handleToggleSyncIgnore = useCallback(
        async (path: string, ignored: boolean) => {
            try {
                if (!app.syncService) {
                    console.warn('Sync service not available');
                    return;
                }

                const relativePath = path.replace(rootPath + '/', '');

                if (ignored) {
                    await app.syncService.addIgnorePattern(relativePath);
                } else {
                    await app.syncService.removeIgnorePattern(relativePath);
                }
            } catch (error) {
                console.error('Failed to toggle sync ignore:', error);
            }
        },
        [app, rootPath]
    );

    const handleOpenDialog = useCallback(async (): Promise<string | null> => {
        try {
            const result = await openDialog({
                directory: true,
                multiple: false,
                title: 'Select Folder',
            });

            if (typeof result === 'string') {
                return result;
            }

            return null;
        } catch (error) {
            console.error('Failed to open dialog:', error);
            return null;
        }
    }, []);

    return {
        handleCreateFile,
        handleCreateDirectory,
        handleRename,
        handleDelete,
        handleDeleteMultiple,
        handleMove,
        handleMoveMultiple,
        handleRequestDeleteConfirm,
        handleCopyFile,
        handleCopyPath,
        handleCopyRelativePath,
        handleShowInExplorer,
        handleToggleSyncIgnore,
        handleOpenDialog,
    };
};
