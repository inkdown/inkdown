/**
 * DialogManager Unit Tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

// Create mock functions
const mockShowSaveDialog = vi.fn<() => Promise<string | null>>();
const mockShowOpenFileDialog = vi.fn<() => Promise<string | null>>();
const mockShowOpenFilesDialog = vi.fn<() => Promise<string[]>>();
const mockShowOpenFolderDialog = vi.fn<() => Promise<string | null>>();
const mockSupportsModule = vi.fn<(module: string) => boolean>().mockReturnValue(true);

// Mock native module
vi.mock('@inkdown/core/native', () => ({
    native: {
        supportsModule: mockSupportsModule,
        dialog: {
            showSaveDialog: mockShowSaveDialog,
            showOpenFileDialog: mockShowOpenFileDialog,
            showOpenFilesDialog: mockShowOpenFilesDialog,
            showOpenFolderDialog: mockShowOpenFolderDialog,
        },
    },
}));

const { DialogManager } = await import('@inkdown/core/DialogManager');

describe('DialogManager', () => {
    let dialogManager: InstanceType<typeof DialogManager>;

    beforeEach(() => {
        vi.clearAllMocks();
        mockSupportsModule.mockReturnValue(true);
        dialogManager = new DialogManager();
    });

    describe('showSaveDialog', () => {
        it('should call native save dialog', async () => {
            mockShowSaveDialog.mockResolvedValue('/path/to/file.md');

            const result = await dialogManager.showSaveDialog({
                title: 'Save File',
                defaultName: 'document.md',
            });

            expect(result).toBe('/path/to/file.md');
            expect(mockShowSaveDialog).toHaveBeenCalledWith({
                title: 'Save File',
                defaultPath: undefined,
                defaultName: 'document.md',
                filters: undefined,
            });
        });

        it('should return null when dialog is cancelled', async () => {
            mockShowSaveDialog.mockResolvedValue(null);

            const result = await dialogManager.showSaveDialog();

            expect(result).toBeNull();
        });

        it('should return null when dialog module is not available', async () => {
            mockSupportsModule.mockReturnValue(false);
            const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

            const result = await dialogManager.showSaveDialog();

            expect(result).toBeNull();
            expect(consoleSpy).toHaveBeenCalledWith('Dialog module not available');
            consoleSpy.mockRestore();
        });

        it('should pass file filters', async () => {
            mockShowSaveDialog.mockResolvedValue('/path/to/file.pdf');

            await dialogManager.showSaveDialog({
                filters: [{ name: 'PDF Files', extensions: ['pdf'] }],
            });

            expect(mockShowSaveDialog).toHaveBeenCalledWith(
                expect.objectContaining({
                    filters: [{ name: 'PDF Files', extensions: ['pdf'] }],
                })
            );
        });

        it('should throw error on dialog failure', async () => {
            const error = new Error('Dialog failed');
            mockShowSaveDialog.mockRejectedValue(error);

            await expect(dialogManager.showSaveDialog()).rejects.toThrow('Dialog failed');
        });
    });

    describe('showOpenFileDialog', () => {
        it('should call native open dialog', async () => {
            mockShowOpenFileDialog.mockResolvedValue('/path/to/file.md');

            const result = await dialogManager.showOpenFileDialog({
                title: 'Open File',
            });

            expect(result).toBe('/path/to/file.md');
        });

        it('should return null when cancelled', async () => {
            mockShowOpenFileDialog.mockResolvedValue(null);

            const result = await dialogManager.showOpenFileDialog();

            expect(result).toBeNull();
        });

        it('should return null when dialog module is not available', async () => {
            mockSupportsModule.mockReturnValue(false);
            const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

            const result = await dialogManager.showOpenFileDialog();

            expect(result).toBeNull();
            consoleSpy.mockRestore();
        });
    });

    describe('showOpenFilesDialog', () => {
        it('should call native open files dialog', async () => {
            mockShowOpenFilesDialog.mockResolvedValue(['/path/to/file1.md', '/path/to/file2.md']);

            const result = await dialogManager.showOpenFilesDialog({
                title: 'Select Files',
            });

            expect(result).toEqual(['/path/to/file1.md', '/path/to/file2.md']);
        });

        it('should return empty array when cancelled', async () => {
            mockShowOpenFilesDialog.mockResolvedValue([]);

            const result = await dialogManager.showOpenFilesDialog();

            expect(result).toEqual([]);
        });

        it('should return empty array when dialog module is not available', async () => {
            mockSupportsModule.mockReturnValue(false);
            const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

            const result = await dialogManager.showOpenFilesDialog();

            expect(result).toEqual([]);
            consoleSpy.mockRestore();
        });
    });

    describe('showOpenFolderDialog', () => {
        it('should call native folder dialog', async () => {
            mockShowOpenFolderDialog.mockResolvedValue('/path/to/folder');

            const result = await dialogManager.showOpenFolderDialog({
                title: 'Select Folder',
            });

            expect(result).toBe('/path/to/folder');
        });

        it('should return null when cancelled', async () => {
            mockShowOpenFolderDialog.mockResolvedValue(null);

            const result = await dialogManager.showOpenFolderDialog();

            expect(result).toBeNull();
        });

        it('should return null when dialog module is not available', async () => {
            mockSupportsModule.mockReturnValue(false);
            const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

            const result = await dialogManager.showOpenFolderDialog();

            expect(result).toBeNull();
            consoleSpy.mockRestore();
        });
    });
});
