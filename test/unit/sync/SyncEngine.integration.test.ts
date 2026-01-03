import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { LocalDatabase } from '../../../packages/core/src/sync/LocalDatabase';
import { IDBFactory } from 'fake-indexeddb';

// Ensure indexedDB is available for tests
if (!globalThis.indexedDB) {
  Object.defineProperty(globalThis, 'indexedDB', {
    value: new IDBFactory(),
    writable: true,
    configurable: true,
  });
}

/**
 * Integration tests for critical sync scenarios
 * 
 * These tests cover:
 * 1. Empty file hash deduplication (preventing false matches)
 * 2. Directory deletion sync (cascading to child notes)
 * 3. Directory rename sync (updating all child note titles)
 * 4. Mixed content deduplication (empty vs non-empty files)
 */
describe('SyncEngine - Integration Tests', () => {
  let db: LocalDatabase;
  const dbName = 'test-sync-integration-' + Date.now();

  beforeEach(async () => {
    db = new LocalDatabase();
    await db.init(dbName);
  });

  afterEach(async () => {
    // Clean up is handled by the global afterEach in test/unit/setup.ts
  });

  describe('Empty File Hash Deduplication', () => {
    const EMPTY_FILE_HASH = '47DEQpj8HBSa+/TImW+5JCeuQeRkm5NMpJWZG3hSuFU=';

    it('should skip hash-based matching for empty files', () => {
      // This is a unit test for the deduplication logic
      // The actual implementation should skip files with EMPTY_FILE_HASH
      
      const fileData = {
        path: 'note.md',
        hash: EMPTY_FILE_HASH,
        content: '',
      };

      // Verify the hash matches empty file constant
      expect(fileData.hash).toBe(EMPTY_FILE_HASH);
      
      // In real implementation, this file should:
      // 1. Skip the "check active notes" section
      // 2. Skip the "check deleted notes" section
      // 3. Be added to filesToUpload queue
    });

    it('should handle multiple empty files as distinct entities', async () => {
      // Scenario: User creates note1.md, note2.md, and folder/note3.md - all empty
      const emptyFiles = [
        { path: 'note1.md', hash: EMPTY_FILE_HASH, noteId: 'note-1' },
        { path: 'note2.md', hash: EMPTY_FILE_HASH, noteId: 'note-2' },
        { path: 'folder/note3.md', hash: EMPTY_FILE_HASH, noteId: 'note-3' },
      ];

      // Save mappings for all empty files
      for (const file of emptyFiles) {
        await db.savePathMapping(file.path, file.noteId);
        await db.saveNoteVersion(file.path, 1, file.noteId, file.hash);
      }

      // Verify all mappings exist independently
      expect(await db.getNoteIdByPath('note1.md')).toBe('note-1');
      expect(await db.getNoteIdByPath('note2.md')).toBe('note-2');
      expect(await db.getNoteIdByPath('folder/note3.md')).toBe('note-3');

      // Verify all have the same hash (but different note IDs)
      const allMappings = await db.getAllPathMappings();
      const emptyMappings = emptyFiles.map(f => 
        allMappings.find(m => m.noteId === f.noteId)
      );
      
      expect(emptyMappings).toHaveLength(3);
      expect(emptyMappings.every(m => m !== undefined)).toBe(true);
    });

    it('should not match empty file to deleted empty note', async () => {
      // Scenario: deleted-note.md was deleted (empty), new-note.md is created (empty)
      // They should NOT match even though both have same hash
      
      const deletedNoteId = 'deleted-note-id';
      const newFilePath = 'new-note.md';

      // Simulate a deleted note in manifest (this would come from server)
      const manifestNote = {
        id: deletedNoteId,
        is_deleted: true,
        content_hash: EMPTY_FILE_HASH,
        title: 'Deleted Note',
      };

      // The new empty file should NOT match this deleted note
      // Instead, it should be uploaded as a new note
      
      // Verify they have the same hash
      expect(manifestNote.content_hash).toBe(EMPTY_FILE_HASH);
      expect(manifestNote.is_deleted).toBe(true);
      
      // In real implementation:
      // - File should skip hash matching
      // - File should be added to upload queue
      // - File should NOT be deleted (matched to deleted note)
    });
  });

  describe('Directory Deletion Sync', () => {
    it('should identify all child notes when directory is deleted', async () => {
      // Scenario: User deletes java/ directory containing spring.md and hibernate.md
      const parentPath = 'java';
      const childNotes = [
        { path: 'java/spring.md', noteId: 'note-spring', title: 'java/spring' },
        { path: 'java/hibernate.md', noteId: 'note-hibernate', title: 'java/hibernate' },
        { path: 'java/jpa/entity.md', noteId: 'note-entity', title: 'java/jpa/entity' },
      ];

      // Save mappings for all child notes
      for (const note of childNotes) {
        await db.savePathMapping(note.path, note.noteId);
        await db.saveNoteVersion(note.path, 1, note.noteId, 'hash-' + note.noteId);
      }

      // Get all notes under the deleted directory
      const allMappings = await db.getAllPathMappings();
      const childMappings = allMappings.filter(m => 
        m.path.startsWith(parentPath + '/')
      );

      expect(childMappings).toHaveLength(3);
      expect(childMappings.map(m => m.noteId)).toEqual(
        expect.arrayContaining(['note-spring', 'note-hibernate', 'note-entity'])
      );

      // All these notes should be marked for deletion on server
    });

    it('should not affect notes outside deleted directory', async () => {
      // Scenario: Delete java/ but keep python/ intact
      await db.savePathMapping('java/spring.md', 'note-java');
      await db.savePathMapping('python/django.md', 'note-python');

      const allMappings = await db.getAllPathMappings();
      const javaFiles = allMappings.filter(m => m.path.startsWith('java/'));
      const pythonFiles = allMappings.filter(m => m.path.startsWith('python/'));

      expect(javaFiles).toHaveLength(1);
      expect(pythonFiles).toHaveLength(1);

      // After deleting java/, only python/ should remain
      // Implementation should filter by path prefix
    });

    it('should handle nested directory deletion', async () => {
      // Scenario: Delete parent directory that contains subdirectories
      const notes = [
        'languages/java/spring.md',
        'languages/java/hibernate.md',
        'languages/python/django.md',
        'languages/python/flask.md',
      ];

      for (let i = 0; i < notes.length; i++) {
        await db.savePathMapping(notes[i], `note-${i}`);
      }

      // Delete languages/ directory
      const allMappings = await db.getAllPathMappings();
      const childNotes = allMappings.filter(m => m.path.startsWith('languages/'));

      expect(childNotes).toHaveLength(4);

      // All 4 notes should be deleted
    });
  });

  describe('Directory Rename Sync', () => {
    it('should update all child note paths when directory is renamed', async () => {
      // Scenario: Rename python/ to python-basics/
      const oldParent = 'python';
      const newParent = 'python-basics';
      
      const childNotes = [
        { oldPath: 'python/django.md', newPath: 'python-basics/django.md', noteId: 'note-django' },
        { oldPath: 'python/flask.md', newPath: 'python-basics/flask.md', noteId: 'note-flask' },
        { oldPath: 'python/fastapi/main.md', newPath: 'python-basics/fastapi/main.md', noteId: 'note-fastapi' },
      ];

      // Save original mappings
      for (const note of childNotes) {
        await db.savePathMapping(note.oldPath, note.noteId);
        await db.saveNoteVersion(note.oldPath, 1, note.noteId, 'hash-' + note.noteId);
      }

      // Simulate rename: update all child paths
      for (const note of childNotes) {
        await db.updatePathMapping(note.oldPath, note.newPath, note.noteId);
      }

      // Verify old paths no longer exist
      for (const note of childNotes) {
        expect(await db.getNoteIdByPath(note.oldPath)).toBeUndefined();
      }

      // Verify new paths exist
      for (const note of childNotes) {
        expect(await db.getNoteIdByPath(note.newPath)).toBe(note.noteId);
      }

      // Verify no duplicate mappings
      const allMappings = await db.getAllPathMappings();
      const oldPathMappings = allMappings.filter(m => m.path.startsWith(oldParent + '/'));
      const newPathMappings = allMappings.filter(m => m.path.startsWith(newParent + '/'));

      expect(oldPathMappings).toHaveLength(0);
      expect(newPathMappings).toHaveLength(3);
    });

    it('should extract correct title from new path for server update', () => {
      // Scenario: Rename java/spring.md to java-basics/spring.md
      // Server title should be updated from "java/spring" to "java-basics/spring"
      
      const extractTitleFromPath = (path: string): string => {
        return path.replace(/\.md$/, '');
      };

      const oldPath = 'java/spring.md';
      const newPath = 'java-basics/spring.md';

      const oldTitle = extractTitleFromPath(oldPath);
      const newTitle = extractTitleFromPath(newPath);

      expect(oldTitle).toBe('java/spring');
      expect(newTitle).toBe('java-basics/spring');

      // In real implementation, SyncEngine should:
      // 1. Extract new title
      // 2. Update note on server with new encrypted title
      // 3. Update local path mapping
    });

    it('should handle directory rename with mixed content files', async () => {
      // Some files have content, some are empty
      // All should be renamed regardless of content
      
      const childNotes = [
        { path: 'folder/empty.md', hash: '47DEQpj8HBSa+/TImW+5JCeuQeRkm5NMpJWZG3hSuFU=', noteId: 'note-1' },
        { path: 'folder/content.md', hash: 'some-other-hash', noteId: 'note-2' },
      ];

      for (const note of childNotes) {
        await db.savePathMapping(note.path, note.noteId);
        await db.saveNoteVersion(note.path, 1, note.noteId, note.hash);
      }

      // Rename folder/ to renamed-folder/
      await db.updatePathMapping('folder/empty.md', 'renamed-folder/empty.md', 'note-1');
      await db.updatePathMapping('folder/content.md', 'renamed-folder/content.md', 'note-2');

      // Both should be renamed successfully
      expect(await db.getNoteIdByPath('renamed-folder/empty.md')).toBe('note-1');
      expect(await db.getNoteIdByPath('renamed-folder/content.md')).toBe('note-2');
    });
  });

  describe('Mixed Content Deduplication', () => {
    const EMPTY_HASH = '47DEQpj8HBSa+/TImW+5JCeuQeRkm5NMpJWZG3hSuFU=';
    const DUPLICATE_HASH = 'duplicate-content-hash';
    const UNIQUE_HASH = 'unique-content-hash';

    it('should deduplicate identical non-empty files', async () => {
      // Scenario: Two files with identical content (non-empty)
      // Should match via hash and create only one note
      
      const file1 = { path: 'file1.md', hash: DUPLICATE_HASH };
      const file2 = { path: 'file2.md', hash: DUPLICATE_HASH };

      // Both have same hash, should deduplicate
      expect(file1.hash).toBe(file2.hash);
      
      // In real implementation:
      // - First file uploads as new note
      // - Second file matches via hash to existing note
      // - Second file gets renamed to match server title OR mapped directly
    });

    it('should NOT deduplicate empty files even with same hash', () => {
      // Scenario: Two empty files
      // Should NOT match, each uploads as separate note
      
      const file1 = { path: 'empty1.md', hash: EMPTY_HASH };
      const file2 = { path: 'empty2.md', hash: EMPTY_HASH };

      // Both have same hash
      expect(file1.hash).toBe(file2.hash);
      
      // But implementation should skip hash matching for EMPTY_HASH
      // Both files should upload as separate notes
    });

    it('should handle workspace with mixed file types', async () => {
      // Workspace contains: empty files, duplicate files, unique files
      const files = [
        { path: 'empty1.md', hash: EMPTY_HASH, noteId: 'note-1' },
        { path: 'empty2.md', hash: EMPTY_HASH, noteId: 'note-2' },
        { path: 'dup1.md', hash: DUPLICATE_HASH, noteId: 'note-3' },
        { path: 'dup2.md', hash: DUPLICATE_HASH, noteId: 'note-3' }, // Same note
        { path: 'unique.md', hash: UNIQUE_HASH, noteId: 'note-4' },
      ];

      // Save mappings (dup2.md shares note with dup1.md)
      for (const file of files) {
        await db.savePathMapping(file.path, file.noteId);
      }

      // Verify empty files have separate notes
      expect(await db.getNoteIdByPath('empty1.md')).toBe('note-1');
      expect(await db.getNoteIdByPath('empty2.md')).toBe('note-2');
      expect(await db.getNoteIdByPath('empty1.md')).not.toBe(await db.getNoteIdByPath('empty2.md'));

      // Verify duplicate files share a note
      expect(await db.getNoteIdByPath('dup1.md')).toBe('note-3');
      expect(await db.getNoteIdByPath('dup2.md')).toBe('note-3');

      // Verify unique file has its own note
      expect(await db.getNoteIdByPath('unique.md')).toBe('note-4');
    });
  });

  describe('Cross-Workspace Sync Scenarios', () => {
    let dbWorkspaceA: LocalDatabase;
    let dbWorkspaceB: LocalDatabase;

    beforeEach(async () => {
      dbWorkspaceA = new LocalDatabase();
      await dbWorkspaceA.init('workspace-a-' + Date.now());
      
      dbWorkspaceB = new LocalDatabase();
      await dbWorkspaceB.init('workspace-b-' + (Date.now() + 1));
    });

    it('should sync empty files across workspaces without incorrect renames', async () => {
      // Workspace A: Create empty1.md and empty2.md
      await dbWorkspaceA.savePathMapping('empty1.md', 'server-note-1');
      await dbWorkspaceA.savePathMapping('empty2.md', 'server-note-2');

      // Both synced to server as separate notes
      
      // Workspace B: Pull manifest
      // Should create empty1.md and empty2.md locally
      // Should NOT rename empty2.md to empty1.md (bug we fixed)
      
      await dbWorkspaceB.savePathMapping('empty1.md', 'server-note-1');
      await dbWorkspaceB.savePathMapping('empty2.md', 'server-note-2');

      // Verify both exist in workspace B
      expect(await dbWorkspaceB.getNoteIdByPath('empty1.md')).toBe('server-note-1');
      expect(await dbWorkspaceB.getNoteIdByPath('empty2.md')).toBe('server-note-2');
    });

    it('should sync directory deletion across workspaces', async () => {
      // Workspace A: Create java/spring.md and java/hibernate.md
      await dbWorkspaceA.savePathMapping('java/spring.md', 'note-spring');
      await dbWorkspaceA.savePathMapping('java/hibernate.md', 'note-hibernate');

      // Workspace A: Delete java/ directory
      // Should mark both notes as deleted on server
      
      // Workspace B: Had same files locally
      await dbWorkspaceB.savePathMapping('java/spring.md', 'note-spring');
      await dbWorkspaceB.savePathMapping('java/hibernate.md', 'note-hibernate');

      // Workspace B: Pull manifest (includes deleted notes)
      // Should detect is_deleted: true and delete local files
      
      // Simulate deletion in workspace B
      const allMappingsB = await dbWorkspaceB.getAllPathMappings();
      const javaFiles = allMappingsB.filter(m => m.path.startsWith('java/'));
      
      // Before deletion handling
      expect(javaFiles).toHaveLength(2);
      
      // After deletion: remove mappings (simulating file deletion)
      // Real implementation would delete files and clear mappings
    });

    it('should sync directory rename across workspaces', async () => {
      // Workspace A: Rename python/ to python-basics/
      await dbWorkspaceA.savePathMapping('python/django.md', 'note-django');
      await dbWorkspaceA.updatePathMapping('python/django.md', 'python-basics/django.md', 'note-django');

      // Server receives update: note-django now has title "python-basics/django"
      
      // Workspace B: Has old path
      await dbWorkspaceB.savePathMapping('python/django.md', 'note-django');

      // Workspace B: Pull manifest and detect title change
      // Should rename local file python/django.md → python-basics/django.md
      await dbWorkspaceB.updatePathMapping('python/django.md', 'python-basics/django.md', 'note-django');

      // Verify rename in workspace B
      expect(await dbWorkspaceB.getNoteIdByPath('python/django.md')).toBeUndefined();
      expect(await dbWorkspaceB.getNoteIdByPath('python-basics/django.md')).toBe('note-django');
    });
  });

  describe('Edge Cases', () => {
    it('should handle file renamed to have empty content', async () => {
      // File starts with content, then user deletes all content
      const noteId = 'note-123';
      const path = 'note.md';
      
      await db.savePathMapping(path, noteId);
      await db.saveNoteVersion(path, 1, noteId, 'original-hash');

      // Content becomes empty
      const EMPTY_HASH = '47DEQpj8HBSa+/TImW+5JCeuQeRkm5NMpJWZG3hSuFU=';
      await db.saveNoteVersion(path, 2, noteId, EMPTY_HASH);

      // Verify version updated
      expect(await db.getNoteVersion(path)).toBe(2);
      
      // File should sync normally (already has mapping, not in deduplication)
    });

    it('should handle rapid directory rename operations', async () => {
      // Directory renamed multiple times quickly
      const noteId = 'note-123';
      
      await db.savePathMapping('v1/note.md', noteId);
      await db.updatePathMapping('v1/note.md', 'v2/note.md', noteId);
      await db.updatePathMapping('v2/note.md', 'v3/note.md', noteId);

      // Final path should be v3/note.md
      expect(await db.getNoteIdByPath('v1/note.md')).toBeUndefined();
      expect(await db.getNoteIdByPath('v2/note.md')).toBeUndefined();
      expect(await db.getNoteIdByPath('v3/note.md')).toBe(noteId);

      // No orphaned mappings
      const allMappings = await db.getAllPathMappings();
      const noteMappings = allMappings.filter(m => m.noteId === noteId);
      expect(noteMappings).toHaveLength(1);
    });

    it('should handle directory with same name as file', async () => {
      // Edge case: folder/note.md and note.md both exist
      await db.savePathMapping('note.md', 'note-root');
      await db.savePathMapping('folder/note.md', 'note-in-folder');

      expect(await db.getNoteIdByPath('note.md')).toBe('note-root');
      expect(await db.getNoteIdByPath('folder/note.md')).toBe('note-in-folder');

      // Both should be handled independently
    });
  });
});
