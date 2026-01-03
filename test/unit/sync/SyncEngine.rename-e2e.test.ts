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

/**
 * End-to-end test for the rename sync bug fix
 * 
 * Scenario:
 * 1. Workspace A: Create note "Arquivo.md", upload to server
 * 2. Workspace B: Pull note (creates "Arquivo.md")
 * 3. Workspace B: Rename to "Arquivo renomeado.md", upload
 * 4. Workspace A: Pull update (should rename local file)
 * 
 * Expected: No stale mappings, file properly renamed
 */
describe('SyncEngine - Rename E2E', () => {
  let dbWorkspaceA: LocalDatabase;
  let dbWorkspaceB: LocalDatabase;
  const dbNameA = 'test-workspace-a-' + Date.now();
  const dbNameB = 'test-workspace-b-' + (Date.now() + 1);

  beforeEach(async () => {
    dbWorkspaceA = new LocalDatabase();
    await dbWorkspaceA.init(dbNameA);

    dbWorkspaceB = new LocalDatabase();
    await dbWorkspaceB.init(dbNameB);
  });

  afterEach(async () => {
    // Clean up is handled by the global afterEach in test/unit/setup.ts
    // which deletes all IndexedDB databases after each test
  });

  it('should not create stale mappings when syncing renamed files', async () => {
    const noteId = 'test-note-rename-123';
    const originalPath = '/workspace-a/Arquivo.md';
    const renamedPath = '/workspace-a/Arquivo renomeado.md';

    // Workspace A: Create and map original file
    await dbWorkspaceA.savePathMapping(originalPath, noteId);
    await dbWorkspaceA.saveNoteVersion(originalPath, 1, noteId, 'hash1');

    // Workspace A: Simulate rename (what SyncEngine.renameLocalFile does)
    await dbWorkspaceA.updatePathMapping(originalPath, renamedPath, noteId);

    // Verify old mapping is gone
    expect(await dbWorkspaceA.getNoteIdByPath(originalPath)).toBeUndefined();
    expect(await dbWorkspaceA.getNoteIdByPath(renamedPath)).toBe(noteId);

    // Verify version data transferred
    expect(await dbWorkspaceA.getNoteVersion(originalPath)).toBeUndefined();
    expect(await dbWorkspaceA.getNoteVersion(renamedPath)).toBe(1);

    // Verify no orphaned mappings
    const allMappings = await dbWorkspaceA.getAllPathMappings();
    const pathsForNote = allMappings.filter(m => m.noteId === noteId);
    
    expect(pathsForNote).toHaveLength(1);
    expect(pathsForNote[0].path).toBe(renamedPath);
  });

  it('should handle cross-workspace rename sync scenario', async () => {
    const noteId = 'cross-workspace-note';
    const pathWorkspaceA = '/workspace-a/Original.md';
    const pathWorkspaceB = '/workspace-b/Original.md';
    const renamedPathB = '/workspace-b/Renamed.md';

    // Workspace A: Create original
    await dbWorkspaceA.savePathMapping(pathWorkspaceA, noteId);
    await dbWorkspaceA.saveNoteVersion(pathWorkspaceA, 1, noteId, 'contentHash1');

    // Workspace B: Pull and create local copy
    await dbWorkspaceB.savePathMapping(pathWorkspaceB, noteId);
    await dbWorkspaceB.saveNoteVersion(pathWorkspaceB, 1, noteId, 'contentHash1');

    // Workspace B: Rename
    await dbWorkspaceB.updatePathMapping(pathWorkspaceB, renamedPathB, noteId);
    await dbWorkspaceB.saveNoteVersion(renamedPathB, 2, noteId, 'contentHash1');

    // Workspace A: Simulate pulling rename from server
    // (this is what performFullReconciliation or applyRemoteUpdate would do)
    const renamedPathA = '/workspace-a/Renamed.md';
    await dbWorkspaceA.updatePathMapping(pathWorkspaceA, renamedPathA, noteId);
    await dbWorkspaceA.saveNoteVersion(renamedPathA, 2, noteId, 'contentHash1');

    // Verify both workspaces have clean state
    expect(await dbWorkspaceA.getNoteIdByPath(pathWorkspaceA)).toBeUndefined();
    expect(await dbWorkspaceA.getNoteIdByPath(renamedPathA)).toBe(noteId);

    expect(await dbWorkspaceB.getNoteIdByPath(pathWorkspaceB)).toBeUndefined();
    expect(await dbWorkspaceB.getNoteIdByPath(renamedPathB)).toBe(noteId);

    // No stale mappings in either workspace
    const mappingsA = await dbWorkspaceA.getAllPathMappings();
    const mappingsB = await dbWorkspaceB.getAllPathMappings();

    expect(mappingsA.filter(m => m.noteId === noteId)).toHaveLength(1);
    expect(mappingsB.filter(m => m.noteId === noteId)).toHaveLength(1);
  });

  it('should preserve version data through multiple renames', async () => {
    const noteId = 'multi-rename-note';
    const path1 = '/workspace/Version1.md';
    const path2 = '/workspace/Version2.md';
    const path3 = '/workspace/Version3.md';

    // Initial state
    await dbWorkspaceA.savePathMapping(path1, noteId);
    await dbWorkspaceA.saveNoteVersion(path1, 1, noteId, 'hash1');

    // First rename
    await dbWorkspaceA.updatePathMapping(path1, path2, noteId);
    await dbWorkspaceA.saveNoteVersion(path2, 2, noteId, 'hash2');

    // Second rename
    await dbWorkspaceA.updatePathMapping(path2, path3, noteId);
    await dbWorkspaceA.saveNoteVersion(path3, 3, noteId, 'hash3');

    // Verify final state
    expect(await dbWorkspaceA.getNoteIdByPath(path1)).toBeUndefined();
    expect(await dbWorkspaceA.getNoteIdByPath(path2)).toBeUndefined();
    expect(await dbWorkspaceA.getNoteIdByPath(path3)).toBe(noteId);
    expect(await dbWorkspaceA.getNoteVersion(path3)).toBe(3);
    expect(await dbWorkspaceA.getContentHash(path3)).toBe('hash3');

    // Only one mapping exists
    const allMappings = await dbWorkspaceA.getAllPathMappings();
    expect(allMappings.filter(m => m.noteId === noteId)).toHaveLength(1);
  });
});
