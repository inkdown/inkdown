# Sync System Fixes - Implementation Plan

**Date:** 2026-01-02
**Goal:** Fix password persistence and sync inconsistency issues
**Approach:** TDD with incremental commits

---

## Investigation Summary

### Problem 1: Password/Key Disappearing
**Root Cause:** Encryption key stored encrypted with access token. When token refreshes, key becomes undecryptable.

**Fix:** Store encrypted master key blob + salt. Derive key from password on restore (token-independent).

### Problem 2: Sync Inconsistency
**Root Causes:** 
- Incomplete reconciliation logic
- Missing rename/move handling
- No conflict UI

**Fix:** Robust state diffing, conflict resolution UI, proper file operation handling.

---

## Phase 1: Fix Encryption Key Persistence

### Task 1.1: Create EncryptionManager Tests

**File:** `test/unit/sync/EncryptionManager.test.ts`

**Steps:**
1. Create test file
2. Add test for key persistence across token refresh
3. Add test for wrong password rejection
4. Run tests (expect FAIL - methods don't exist yet)

**Expected:** Tests fail because `restoreFromPassword()` doesn't exist

---

### Task 1.2: Update EncryptionManager Storage

**File:** `packages/core/src/sync/EncryptionManager.ts`

**Changes:**
1. Add properties: `encryptedMasterKeyBlob`, `keySalt`
2. Replace `saveToStorage()` - remove token dependency
3. Replace `restoreFromStorage()` with `restoreFromPassword(password)`
4. Update `setupEncryption()` to store blob+salt
5. Update `syncKeys()` to store blob+salt
6. Update `clearStorage()` to remove old format

**Expected:** Tests pass

---

### Task 1.3: Update SyncEngine

**File:** `packages/core/src/sync/SyncEngine.ts`

**Changes:**
1. Modify `start()` method to use `restoreFromPassword()`
2. Add event emission: `encryption-required`

**Expected:** App can restore encryption without re-entering password

---

### Task 1.4: Add Password Caching to SyncManager

**File:** `packages/core/src/managers/SyncManager.ts`

**Changes:**
1. Add property: `lastPassword`
2. Add `getLastPassword()` method
3. Add `setLastPassword()` method
4. Update `setupEncryption()` to cache password
5. Update `unlockEncryption()` to cache password
6. Update `disable()` to clear password

**Expected:** Password cached in memory for auto-restore

**Commit:** "fix: encryption key persistence independent of token"

---

## Phase 2: Add Sync Debugging

### Task 2.1: Create SyncDebugger

**File:** `packages/core/src/sync/SyncDebugger.ts`

**Create new file with:**
- `SyncStateSnapshot` interface
- `SyncDebugger` class
- Methods: `captureSnapshot()`, `calculateDifferences()`, `logSnapshot()`

**Expected:** Can capture and log sync state

---

### Task 2.2: Integrate SyncDebugger

**File:** `packages/core/src/sync/SyncEngine.ts`

**Changes:**
1. Import `SyncDebugger`
2. Add property: `syncDebugger`
3. Add methods: `getLocalFileState()`, `getServerFileState()`, `calculateHash()`
4. Update `performFullReconciliation()` to capture snapshots

**Expected:** Sync state logged to console during reconciliation

**Commit:** "feat: add sync state debugging"

---

## Phase 3: Fix Sync Reconciliation

### Task 3.1: Implement Robust Reconciliation

**File:** `packages/core/src/sync/SyncEngine.ts`

**Changes:**
1. Rewrite `performFullReconciliation()`:
   - Separate server-only, local-only, modified, conflicts
   - Process each category correctly
2. Add `downloadFile()` method
3. Add `uploadFile()` method  
4. Add `handleConflict()` method

**Expected:** Files sync correctly in all scenarios

**Commit:** "fix: robust sync reconciliation"

---

## Phase 4: Add Conflict Resolution UI

### Task 4.1: Create ConflictResolver Component

**Files:**
- `packages/ui/src/components/ConflictResolver.tsx`
- `packages/ui/src/components/ConflictResolver.css`

**Create:**
- Interface: `Conflict`
- Component: `ConflictResolver`
- Styling with side-by-side diff view

**Expected:** Conflict UI component ready

---

### Task 4.2: Integrate Conflict UI

**File:** `apps/desktop/src/App.tsx`

**Changes:**
1. Import `ConflictResolver`
2. Add state: `conflicts`, `showConflictResolver`
3. Add effect to listen for `conflict-detected` event
4. Add handler: `handleResolveConflict()`
5. Render `ConflictResolver` when conflicts exist

**Expected:** Conflict UI appears when conflicts detected

**Commit:** "feat: add conflict resolution UI"

---

## Phase 5: File Operation Support

### Task 5.1: Handle Renames and Moves

**File:** `packages/core/src/sync/FileWatcherService.ts`

**Changes:**
1. Add `handleFileRename()` method
2. Add `handleFileMove()` method

**File:** `packages/core/src/sync/SyncEngine.ts`

**Changes:**
1. Listen for `rename` and `move` events
2. Add `handleFileRename()` handler
3. Add `handleFileMove()` handler

**Expected:** Renames and moves sync correctly

**Commit:** "fix: sync file renames and moves"

---

## Phase 6: Testing & Verification

### Task 6.1: Manual Testing

**Checklist:**
- [ ] Set password, restart app - no re-prompt
- [ ] Token refresh - encryption still works
- [ ] Create file locally - uploads
- [ ] Create file on server - downloads
- [ ] Modify file locally - uploads
- [ ] Modify file on server - downloads
- [ ] Rename file - syncs correctly
- [ ] Create conflict - UI appears
- [ ] Resolve conflict - applies correctly

**Expected:** All tests pass

---

## Phase 7: Documentation

### Task 7.1: Update Documentation

**File:** `docs/sync/ARCHITECTURE.md`

**Create:**
- Overview of encryption
- Sync reconciliation algorithm
- Conflict resolution flow
- Debugging guide

**File:** `README.md`

**Update:**
- Add sync system section
- Link to architecture doc

**Commit:** "docs: sync system architecture"

---

## Execution Checklist

- [ ] Phase 1: Encryption persistence (Tasks 1.1-1.4)
- [ ] Phase 2: Sync debugging (Tasks 2.1-2.2)
- [ ] Phase 3: Reconciliation (Task 3.1)
- [ ] Phase 4: Conflict UI (Tasks 4.1-4.2)
- [ ] Phase 5: File operations (Task 5.1)
- [ ] Phase 6: Testing (Task 6.1)
- [ ] Phase 7: Documentation (Task 7.1)

---

**Total Commits:** ~7 focused commits
**Estimated Time:** 4-6 hours

