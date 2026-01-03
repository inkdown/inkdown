import { describe, it, expect, beforeEach, afterEach } from 'vitest';
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

describe('LocalDatabase - Path Mapping Updates', () => {
  let db: LocalDatabase;
  let testDbName: string;

  beforeEach(async () => {
    testDbName = 'test-sync-cache-' + Date.now() + '-' + Math.random();
    db = new LocalDatabase();
    await db.init(testDbName);
  });

  afterEach(async () => {
    // Clean up is handled by the global afterEach in test/unit/setup.ts
    // which deletes all IndexedDB databases after each test
  });

  it('should update path mapping when file is renamed', async () => {
    const oldPath = '/workspace/old-name.md';
    const newPath = '/workspace/new-name.md';
    const noteId = 'test-note-123';

    // Create initial mapping
    await db.savePathMapping(oldPath, noteId);

    // Verify initial state
    expect(await db.getNoteIdByPath(oldPath)).toBe(noteId);
    expect(await db.getPathByNoteId(noteId)).toBe(oldPath);

    // Update to new path
    await db.updatePathMapping(oldPath, newPath, noteId);

    // Old path should not exist
    expect(await db.getNoteIdByPath(oldPath)).toBeUndefined();
    
    // New path should be mapped
    expect(await db.getNoteIdByPath(newPath)).toBe(noteId);
    expect(await db.getPathByNoteId(noteId)).toBe(newPath);
  });

  it('should transfer note version data when updating path', async () => {
    const oldPath = '/workspace/old-name.md';
    const newPath = '/workspace/new-name.md';
    const noteId = 'test-note-456';
    const version = 5;
    const contentHash = 'abc123hash';

    // Create initial mapping with version
    await db.savePathMapping(oldPath, noteId);
    await db.saveNoteVersion(oldPath, version, noteId, contentHash);

    // Verify initial version data
    expect(await db.getNoteVersion(oldPath)).toBe(version);
    expect(await db.getContentHash(oldPath)).toBe(contentHash);

    // Update to new path
    await db.updatePathMapping(oldPath, newPath, noteId);

    // Old path version data should be gone
    expect(await db.getNoteVersion(oldPath)).toBeUndefined();
    expect(await db.getContentHash(oldPath)).toBeUndefined();

    // New path should have the version data
    expect(await db.getNoteVersion(newPath)).toBe(version);
    expect(await db.getContentHash(newPath)).toBe(contentHash);
  });

  it('should handle updating path when old path has no version data', async () => {
    const oldPath = '/workspace/old.md';
    const newPath = '/workspace/new.md';
    const noteId = 'test-note-789';

    await db.savePathMapping(oldPath, noteId);
    
    // Should not throw even without version data
    await db.updatePathMapping(oldPath, newPath, noteId);

    expect(await db.getNoteIdByPath(newPath)).toBe(noteId);
  });
});
