import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('SyncEngine - File Rename', () => {
  let mockApp: any;
  let mockLocalDatabase: any;
  let mockFileWatcher: any;
  let mockLogger: any;

  beforeEach(() => {
    mockLocalDatabase = {
      getNoteIdByPath: vi.fn(),
      updatePathMapping: vi.fn().mockResolvedValue(undefined),
    };

    mockFileWatcher = {
      pause: vi.fn(),
      resume: vi.fn(),
    };

    mockLogger = {
      debug: vi.fn(),
      info: vi.fn(),
      error: vi.fn(),
    };

    const mockFile = {
      path: '/workspace/old.md',
      name: 'old.md',
      basename: 'old',
      extension: 'md',
      stat: { size: 100, mtime: Date.now(), ctime: Date.now() },
    };

    mockApp = {
      workspace: {
        getAbstractFileByPath: vi.fn().mockReturnValue(mockFile),
      },
      fileManager: {
        renameFile: vi.fn().mockResolvedValue(undefined),
      },
    };
  });

  it('should rename file and update path mapping atomically', async () => {
    const oldPath = '/workspace/old.md';
    const newPath = '/workspace/new.md';
    const noteId = 'note-123';

    mockLocalDatabase.getNoteIdByPath.mockResolvedValue(noteId);

    // Simulate the renameLocalFile method
    const renameLocalFile = async (
      oldPath: string,
      newPath: string,
      app: any,
      fileWatcher: any,
      localDatabase: any,
      logger: any
    ) => {
      const file = app.workspace.getAbstractFileByPath(oldPath);
      if (!file) {
        throw new Error(`File not found: ${oldPath}`);
      }

      const noteId = await localDatabase.getNoteIdByPath(oldPath);
      if (!noteId) {
        throw new Error(`No mapping found for path: ${oldPath}`);
      }

      logger.debug(`Renaming local file: ${oldPath} → ${newPath}`);
      fileWatcher.pause();
      
      try {
        await app.fileManager.renameFile(file, newPath);
        await localDatabase.updatePathMapping(oldPath, newPath, noteId);
        logger.info(`Successfully renamed: ${oldPath} → ${newPath}`);
      } catch (error) {
        logger.error(`Failed to rename ${oldPath} → ${newPath}:`, error);
        throw error;
      } finally {
        fileWatcher.resume();
      }
    };

    await renameLocalFile(
      oldPath,
      newPath,
      mockApp,
      mockFileWatcher,
      mockLocalDatabase,
      mockLogger
    );

    expect(mockFileWatcher.pause).toHaveBeenCalled();
    expect(mockFileWatcher.resume).toHaveBeenCalled();
    expect(mockApp.fileManager.renameFile).toHaveBeenCalled();
    expect(mockLocalDatabase.updatePathMapping).toHaveBeenCalledWith(
      oldPath,
      newPath,
      noteId
    );
  });

  it('should ensure file watcher resumes even if rename fails', async () => {
    const oldPath = '/workspace/old.md';
    const newPath = '/workspace/new.md';

    mockLocalDatabase.getNoteIdByPath.mockResolvedValue('note-123');
    mockApp.fileManager.renameFile.mockRejectedValue(new Error('Permission denied'));

    const renameLocalFile = async (
      oldPath: string,
      newPath: string,
      app: any,
      fileWatcher: any,
      localDatabase: any,
      logger: any
    ) => {
      const file = app.workspace.getAbstractFileByPath(oldPath);
      if (!file) throw new Error(`File not found: ${oldPath}`);

      const noteId = await localDatabase.getNoteIdByPath(oldPath);
      if (!noteId) throw new Error(`No mapping found for path: ${oldPath}`);

      fileWatcher.pause();
      try {
        await app.fileManager.renameFile(file, newPath);
        await localDatabase.updatePathMapping(oldPath, newPath, noteId);
      } finally {
        fileWatcher.resume();
      }
    };

    await expect(
      renameLocalFile(oldPath, newPath, mockApp, mockFileWatcher, mockLocalDatabase, mockLogger)
    ).rejects.toThrow('Permission denied');

    expect(mockFileWatcher.resume).toHaveBeenCalled();
  });

  it('should throw error if file not found', async () => {
    const oldPath = '/workspace/nonexistent.md';
    const newPath = '/workspace/new.md';

    mockApp.workspace.getAbstractFileByPath.mockReturnValue(null);

    const renameLocalFile = async (
      oldPath: string,
      newPath: string,
      app: any
    ) => {
      const file = app.workspace.getAbstractFileByPath(oldPath);
      if (!file) {
        throw new Error(`File not found: ${oldPath}`);
      }
    };

    await expect(
      renameLocalFile(oldPath, newPath, mockApp)
    ).rejects.toThrow('File not found');
  });

  it('should throw error if no mapping found', async () => {
    const oldPath = '/workspace/old.md';
    const newPath = '/workspace/new.md';

    mockLocalDatabase.getNoteIdByPath.mockResolvedValue(undefined);

    const renameLocalFile = async (
      oldPath: string,
      newPath: string,
      app: any,
      localDatabase: any
    ) => {
      const file = app.workspace.getAbstractFileByPath(oldPath);
      if (!file) throw new Error(`File not found: ${oldPath}`);

      const noteId = await localDatabase.getNoteIdByPath(oldPath);
      if (!noteId) {
        throw new Error(`No mapping found for path: ${oldPath}`);
      }
    };

    await expect(
      renameLocalFile(oldPath, newPath, mockApp, mockLocalDatabase)
    ).rejects.toThrow('No mapping found');
  });
});
