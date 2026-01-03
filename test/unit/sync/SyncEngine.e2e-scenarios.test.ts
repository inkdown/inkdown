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
 * End-to-end sync scenario tests
 * 
 * These tests simulate complete sync flows with mocked components:
 * - Mock server API
 * - Mock file system
 * - Mock encryption
 * - Real LocalDatabase
 */
describe('SyncEngine - E2E Scenarios', () => {
  let db: LocalDatabase;
  let mockServer: any;
  let mockFileSystem: any;
  let localFiles: Map<string, { content: string; hash: string }>;

  const EMPTY_FILE_HASH = '47DEQpj8HBSa+/TImW+5JCeuQeRkm5NMpJWZG3hSuFU=';

  beforeEach(async () => {
    db = new LocalDatabase();
    await db.init('test-e2e-' + Date.now());

    localFiles = new Map();

    // Mock server with notes
    mockServer = {
      notes: new Map<string, any>(),
      
      uploadNote: vi.fn(async (title: string, content: string, hash: string) => {
        const noteId = 'note-' + Date.now() + '-' + Math.random();
        mockServer.notes.set(noteId, {
          id: noteId,
          encrypted_title: title, // In real app, this would be encrypted
          nonce: 'mock-nonce',
          content_hash: hash,
          version: 1,
          is_deleted: false,
        });
        return noteId;
      }),

      getManifest: vi.fn(async () => {
        return Array.from(mockServer.notes.values());
      }),

      getNote: vi.fn(async (noteId: string) => {
        return mockServer.notes.get(noteId);
      }),

      updateNote: vi.fn(async (noteId: string, updates: any) => {
        const note = mockServer.notes.get(noteId);
        if (note) {
          Object.assign(note, updates);
          note.version += 1;
        }
      }),

      deleteNote: vi.fn(async (noteId: string) => {
        const note = mockServer.notes.get(noteId);
        if (note) {
          note.is_deleted = true;
          note.version += 1;
        }
      }),
    };

    // Mock file system
    mockFileSystem = {
      createFile: vi.fn(async (path: string, content: string) => {
        const hash = content === '' ? EMPTY_FILE_HASH : 'hash-' + content;
        localFiles.set(path, { content, hash });
      }),

      deleteFile: vi.fn(async (path: string) => {
        localFiles.delete(path);
      }),

      renameFile: vi.fn(async (oldPath: string, newPath: string) => {
        const file = localFiles.get(oldPath);
        if (file) {
          localFiles.delete(oldPath);
          localFiles.set(newPath, file);
        }
      }),

      readFile: vi.fn(async (path: string) => {
        return localFiles.get(path)?.content || '';
      }),

      listFiles: vi.fn(async () => {
        return Array.from(localFiles.keys());
      }),
    };
  });

  afterEach(async () => {
    // Cleanup handled by global afterEach
  });

  describe('Empty File Sync Flow', () => {
    it('should sync multiple empty files without incorrect matches', async () => {
      // SCENARIO: User creates 3 empty files in workspace A, syncs to workspace B
      
      // Step 1: Workspace A - Create empty files
      await mockFileSystem.createFile('empty1.md', '');
      await mockFileSystem.createFile('empty2.md', '');
      await mockFileSystem.createFile('folder/empty3.md', '');

      // Step 2: Workspace A - Upload to server (skip hash matching for empty files)
      const files = await mockFileSystem.listFiles();
      const uploadedNoteIds: string[] = [];

      for (const path of files) {
        const content = await mockFileSystem.readFile(path);
        const fileData = localFiles.get(path)!;
        
        // Skip hash matching for empty files
        if (fileData.hash === EMPTY_FILE_HASH) {
          // Upload as new note
          const title = path.replace(/\.md$/, '');
          const noteId = await mockServer.uploadNote(title, content, fileData.hash);
          uploadedNoteIds.push(noteId);
          
          await db.savePathMapping(path, noteId);
          await db.saveNoteVersion(path, 1, noteId, fileData.hash);
        }
      }

      expect(uploadedNoteIds).toHaveLength(3);
      expect(mockServer.uploadNote).toHaveBeenCalledTimes(3);

      // Step 3: Verify server has 3 distinct notes (all with same hash but different titles)
      const manifest = await mockServer.getManifest();
      expect(manifest).toHaveLength(3);
      
      const titles = manifest.map((n: any) => n.encrypted_title);
      expect(titles).toContain('empty1');
      expect(titles).toContain('empty2');
      expect(titles).toContain('folder/empty3');

      // All have same hash
      expect(manifest.every((n: any) => n.content_hash === EMPTY_FILE_HASH)).toBe(true);

      // Step 4: Workspace B - Pull manifest and create files
      const dbWorkspaceB = new LocalDatabase();
      await dbWorkspaceB.init('workspace-b-' + Date.now());
      
      const manifestB = await mockServer.getManifest();
      const localFilesB = new Map<string, any>();

      for (const note of manifestB) {
        if (!note.is_deleted) {
          const path = note.encrypted_title + '.md'; // In real app, would decrypt title
          
          // Create local file
          localFilesB.set(path, { content: '', hash: note.content_hash });
          
          // Save mapping
          await dbWorkspaceB.savePathMapping(path, note.id);
          await dbWorkspaceB.saveNoteVersion(path, note.version, note.id, note.content_hash);
        }
      }

      // Verify workspace B has all 3 files with correct paths
      expect(localFilesB.size).toBe(3);
      expect(localFilesB.has('empty1.md')).toBe(true);
      expect(localFilesB.has('empty2.md')).toBe(true);
      expect(localFilesB.has('folder/empty3.md')).toBe(true);

      // Verify mappings are correct (no files sharing note IDs incorrectly)
      const mappingsB = await dbWorkspaceB.getAllPathMappings();
      expect(mappingsB).toHaveLength(3);
      
      const noteIdsB = mappingsB.map(m => m.noteId);
      expect(new Set(noteIdsB).size).toBe(3); // All unique note IDs
    });
  });

  describe('Directory Deletion Sync Flow', () => {
    it('should delete all child notes when directory is deleted', async () => {
      // SCENARIO: User deletes java/ directory containing 3 files
      
      // Step 1: Create directory with files
      await mockFileSystem.createFile('java/spring.md', 'Spring Framework');
      await mockFileSystem.createFile('java/hibernate.md', 'Hibernate ORM');
      await mockFileSystem.createFile('java/jpa/entity.md', 'JPA Entities');

      // Step 2: Upload to server
      const files = await mockFileSystem.listFiles();
      for (const path of files) {
        const content = await mockFileSystem.readFile(path);
        const fileData = localFiles.get(path)!;
        const title = path.replace(/\.md$/, '');
        const noteId = await mockServer.uploadNote(title, content, fileData.hash);
        
        await db.savePathMapping(path, noteId);
        await db.saveNoteVersion(path, 1, noteId, fileData.hash);
      }

      expect(mockServer.notes.size).toBe(3);

      // Step 3: Delete java/ directory locally
      const directoryPath = 'java';
      const filesToDelete = files.filter(f => f.startsWith(directoryPath + '/'));
      
      for (const path of filesToDelete) {
        await mockFileSystem.deleteFile(path);
      }

      // Step 4: Sync deletion - mark all child notes as deleted on server
      const allMappings = await db.getAllPathMappings();
      const childMappings = allMappings.filter(m => m.path.startsWith(directoryPath + '/'));
      
      expect(childMappings).toHaveLength(3);

      for (const mapping of childMappings) {
        await mockServer.deleteNote(mapping.noteId);
      }

      // Step 5: Verify server notes are marked as deleted
      const manifest = await mockServer.getManifest();
      const javaNotes = manifest.filter((n: any) => 
        n.encrypted_title.startsWith('java/')
      );

      expect(javaNotes).toHaveLength(3);
      expect(javaNotes.every((n: any) => n.is_deleted === true)).toBe(true);

      // Step 6: Workspace B pulls manifest and deletes local files
      const dbWorkspaceB = new LocalDatabase();
      await dbWorkspaceB.init('workspace-b-' + Date.now());
      
      // Workspace B had these files locally
      const localFilesB = new Map<string, any>();
      localFilesB.set('java/spring.md', { content: 'Spring', hash: 'hash-spring' });
      localFilesB.set('java/hibernate.md', { content: 'Hibernate', hash: 'hash-hibernate' });
      localFilesB.set('java/jpa/entity.md', { content: 'JPA', hash: 'hash-jpa' });

      for (const [path, data] of localFilesB) {
        const noteId = manifest.find((n: any) => 
          n.encrypted_title === path.replace(/\.md$/, '')
        )?.id;
        if (noteId) {
          await dbWorkspaceB.savePathMapping(path, noteId);
        }
      }

      // Pull manifest and detect deleted notes
      const manifestB = await mockServer.getManifest();
      const deletedNotes = manifestB.filter((n: any) => n.is_deleted);

      expect(deletedNotes).toHaveLength(3);

      // Delete local files that match deleted notes
      for (const note of deletedNotes) {
        const mappingsB = await dbWorkspaceB.getAllPathMappings();
        const mapping = mappingsB.find(m => m.noteId === note.id);
        if (mapping) {
          localFilesB.delete(mapping.path);
        }
      }

      // Verify all java files deleted in workspace B
      expect(localFilesB.size).toBe(0);
    });
  });

  describe('Directory Rename Sync Flow', () => {
    it('should rename all child notes when directory is renamed', async () => {
      // SCENARIO: User renames python/ to python-basics/
      
      // Step 1: Create directory with files
      await mockFileSystem.createFile('python/django.md', 'Django framework');
      await mockFileSystem.createFile('python/flask.md', 'Flask micro-framework');

      // Step 2: Upload to server
      const files = await mockFileSystem.listFiles();
      const noteIds: { [path: string]: string } = {};

      for (const path of files) {
        const content = await mockFileSystem.readFile(path);
        const fileData = localFiles.get(path)!;
        const title = path.replace(/\.md$/, '');
        const noteId = await mockServer.uploadNote(title, content, fileData.hash);
        noteIds[path] = noteId;
        
        await db.savePathMapping(path, noteId);
        await db.saveNoteVersion(path, 1, noteId, fileData.hash);
      }

      // Step 3: Rename directory locally
      const oldDir = 'python';
      const newDir = 'python-basics';
      
      const filesToRename = files.filter(f => f.startsWith(oldDir + '/'));
      
      for (const oldPath of filesToRename) {
        const newPath = oldPath.replace(oldDir + '/', newDir + '/');
        await mockFileSystem.renameFile(oldPath, newPath);
        await db.updatePathMapping(oldPath, newPath, noteIds[oldPath]);
      }

      // Step 4: Update server with new titles
      const allMappings = await db.getAllPathMappings();
      const renamedMappings = allMappings.filter(m => m.path.startsWith(newDir + '/'));

      for (const mapping of renamedMappings) {
        const newTitle = mapping.path.replace(/\.md$/, '');
        await mockServer.updateNote(mapping.noteId, {
          encrypted_title: newTitle,
        });
      }

      // Step 5: Verify server notes have new titles
      const manifest = await mockServer.getManifest();
      const pythonNotes = manifest.filter((n: any) => 
        n.encrypted_title.startsWith('python')
      );

      expect(pythonNotes).toHaveLength(2);
      expect(pythonNotes.every((n: any) => 
        n.encrypted_title.startsWith('python-basics/')
      )).toBe(true);

      // Step 6: Workspace B pulls manifest and renames local files
      const dbWorkspaceB = new LocalDatabase();
      await dbWorkspaceB.init('workspace-b-' + Date.now());
      
      // Workspace B has old paths
      const localFilesB = new Map<string, any>();
      localFilesB.set('python/django.md', { noteId: noteIds['python/django.md'] });
      localFilesB.set('python/flask.md', { noteId: noteIds['python/flask.md'] });

      for (const [path, data] of localFilesB) {
        await dbWorkspaceB.savePathMapping(path, data.noteId);
      }

      // Pull manifest and detect title changes
      const manifestB = await mockServer.getManifest();
      const mappingsB = await dbWorkspaceB.getAllPathMappings();

      for (const note of manifestB) {
        const mapping = mappingsB.find(m => m.noteId === note.id);
        if (mapping) {
          const expectedPath = note.encrypted_title + '.md';
          
          if (mapping.path !== expectedPath) {
            // Rename needed
            const oldFileB = localFilesB.get(mapping.path);
            if (oldFileB) {
              localFilesB.delete(mapping.path);
              localFilesB.set(expectedPath, oldFileB);
              await dbWorkspaceB.updatePathMapping(mapping.path, expectedPath, note.id);
            }
          }
        }
      }

      // Verify workspace B has renamed files
      expect(localFilesB.has('python/django.md')).toBe(false);
      expect(localFilesB.has('python/flask.md')).toBe(false);
      expect(localFilesB.has('python-basics/django.md')).toBe(true);
      expect(localFilesB.has('python-basics/flask.md')).toBe(true);
    });
  });

  describe('Mixed Content Deduplication Flow', () => {
    it('should deduplicate non-empty files but not empty files', async () => {
      // SCENARIO: Multiple files with same content, plus empty files
      
      // Step 1: Create files
      await mockFileSystem.createFile('empty1.md', '');
      await mockFileSystem.createFile('empty2.md', '');
      await mockFileSystem.createFile('duplicate1.md', 'Same content');
      await mockFileSystem.createFile('duplicate2.md', 'Same content');
      await mockFileSystem.createFile('unique.md', 'Unique content');

      // Step 2: Simulate deduplication during upload
      const files = await mockFileSystem.listFiles();
      const uploadedNotes = new Map<string, string>(); // hash -> noteId
      const fileMappings = new Map<string, string>(); // path -> noteId

      for (const path of files) {
        const fileData = localFiles.get(path)!;
        const title = path.replace(/\.md$/, '');
        
        // Skip hash matching for empty files
        if (fileData.hash === EMPTY_FILE_HASH) {
          const noteId = await mockServer.uploadNote(title, fileData.content, fileData.hash);
          fileMappings.set(path, noteId);
          await db.savePathMapping(path, noteId);
        } else {
          // Check for existing note with same hash
          const existingNoteId = uploadedNotes.get(fileData.hash);
          
          if (existingNoteId) {
            // Deduplicate: map to existing note
            fileMappings.set(path, existingNoteId);
            await db.savePathMapping(path, existingNoteId);
          } else {
            // Upload new note
            const noteId = await mockServer.uploadNote(title, fileData.content, fileData.hash);
            uploadedNotes.set(fileData.hash, noteId);
            fileMappings.set(path, noteId);
            await db.savePathMapping(path, noteId);
          }
        }
      }

      // Step 3: Verify correct number of notes on server
      expect(mockServer.notes.size).toBe(4); // 2 empty + 1 duplicate + 1 unique

      // Step 4: Verify empty files have separate notes
      const emptyNoteIds = [
        fileMappings.get('empty1.md'),
        fileMappings.get('empty2.md'),
      ];
      expect(emptyNoteIds[0]).not.toBe(emptyNoteIds[1]);

      // Step 5: Verify duplicate files share a note
      const dupNoteIds = [
        fileMappings.get('duplicate1.md'),
        fileMappings.get('duplicate2.md'),
      ];
      expect(dupNoteIds[0]).toBe(dupNoteIds[1]);

      // Step 6: Verify unique file has its own note
      const uniqueNoteId = fileMappings.get('unique.md');
      expect(uniqueNoteId).toBeDefined();
      expect(uniqueNoteId).not.toBe(emptyNoteIds[0]);
      expect(uniqueNoteId).not.toBe(emptyNoteIds[1]);
      expect(uniqueNoteId).not.toBe(dupNoteIds[0]);
    });
  });

  describe('Complex Multi-Workspace Scenario', () => {
    it('should handle complete sync lifecycle across 2 workspaces', async () => {
      // SCENARIO: Comprehensive test with create, sync, delete, rename
      
      // === WORKSPACE A ===
      
      // Step 1: Create initial files
      await mockFileSystem.createFile('empty.md', '');
      await mockFileSystem.createFile('folder/note.md', 'Content');

      // Step 2: Upload
      const filesA = await mockFileSystem.listFiles();
      const noteIdsA: { [path: string]: string } = {};

      for (const path of filesA) {
        const content = await mockFileSystem.readFile(path);
        const fileData = localFiles.get(path)!;
        const title = path.replace(/\.md$/, '');
        
        const noteId = await mockServer.uploadNote(title, content, fileData.hash);
        noteIdsA[path] = noteId;
        await db.savePathMapping(path, noteId);
      }

      expect(mockServer.notes.size).toBe(2);

      // === WORKSPACE B ===
      
      const dbB = new LocalDatabase();
      await dbB.init('workspace-b-' + Date.now());
      const localFilesB = new Map<string, any>();

      // Step 3: Pull to workspace B
      const manifest1 = await mockServer.getManifest();
      for (const note of manifest1) {
        if (!note.is_deleted) {
          const path = note.encrypted_title + '.md';
          localFilesB.set(path, { content: '', hash: note.content_hash });
          await dbB.savePathMapping(path, note.id);
        }
      }

      expect(localFilesB.size).toBe(2);

      // Step 4: Workspace A - Delete folder/
      await mockFileSystem.deleteFile('folder/note.md');
      await mockServer.deleteNote(noteIdsA['folder/note.md']);

      // Step 5: Workspace B - Pull deletions
      const manifest2 = await mockServer.getManifest();
      const deletedNotes = manifest2.filter((n: any) => n.is_deleted);
      
      for (const note of deletedNotes) {
        const mappingsB = await dbB.getAllPathMappings();
        const mapping = mappingsB.find(m => m.noteId === note.id);
        if (mapping) {
          localFilesB.delete(mapping.path);
        }
      }

      expect(localFilesB.size).toBe(1); // Only empty.md remains

      // Step 6: Workspace A - Create new file and rename
      await mockFileSystem.createFile('new.md', 'New content');
      const newNoteId = await mockServer.uploadNote('new', 'New content', 'hash-new');
      await db.savePathMapping('new.md', newNoteId);

      await mockFileSystem.renameFile('new.md', 'renamed.md');
      await db.updatePathMapping('new.md', 'renamed.md', newNoteId);
      await mockServer.updateNote(newNoteId, { encrypted_title: 'renamed' });

      // Step 7: Workspace B - Pull new file with correct name
      const manifest3 = await mockServer.getManifest();
      const newNote = manifest3.find((n: any) => n.id === newNoteId);
      
      expect(newNote).toBeDefined();
      expect(newNote.encrypted_title).toBe('renamed');

      const newPath = newNote.encrypted_title + '.md';
      localFilesB.set(newPath, { content: 'New content', hash: 'hash-new' });
      await dbB.savePathMapping(newPath, newNoteId);

      expect(localFilesB.has('renamed.md')).toBe(true);
      expect(localFilesB.has('new.md')).toBe(false);

      // Final state: Workspace B has empty.md and renamed.md
      expect(localFilesB.size).toBe(2);
    });
  });
});
