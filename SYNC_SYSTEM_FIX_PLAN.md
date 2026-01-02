# Sync System Refactoring Plan

## Executive Summary

Based on deep analysis of the codebase, the sync system has the following critical issues:

### Root Causes Identified

1. **Password Persistence Issue** 
   - `CredentialStorage` uses `sessionStorage` which clears on tab/window close
   - `SyncManager.lastPassword` is in-memory only (clears on app restart)
   - Encryption restoration flow is broken after app restart

2. **Encryption Restoration Flow**
   - Current: Uses deprecated v1 flow (`restoreFromStorage(accessToken)`)
   - Should use: v2 flow (`restoreFromPassword(password)`)
   - Password is never persisted, so v2 flow can't work after restart

3. **Inconsistent Sync Engine Behavior**
   - No proper startup sync after encryption restoration
   - File watcher starts before initial sync completes
   - Race conditions between local changes and server state
   - Missing conflict detection on startup

4. **Conflict Resolution Issues**
   - Conflict resolver exists but isn't integrated into sync flow
   - No automatic three-way merge strategy
   - UI shows conflicts but doesn't prevent data loss during resolution

## Implementation Plan

### Phase 1: Secure Password Persistence (Priority: CRITICAL)

#### Task 1.1: Enhanced CredentialStorage with Secure Persistence
**File**: `packages/core/src/sync/CredentialStorage.ts`

**Changes**:
- Replace `sessionStorage` with encrypted `localStorage`
- Use device fingerprint + salt for encryption key derivation
- Implement secure password encryption using Web Crypto API
- Add password verification mechanism
- Provide migration path from old sessionStorage

**Implementation**:
```typescript
export class CredentialStorage {
    private static readonly STORAGE_KEY = 'inkdown_credentials_v2';
    private static readonly SALT_KEY = 'inkdown_credential_salt';
    private static deviceKey: CryptoKey | null = null;

    /**
     * Generate device-specific encryption key
     * Uses combination of navigator properties as fingerprint
     */
    private static async getDeviceKey(): Promise<CryptoKey> {
        if (this.deviceKey) return this.deviceKey;

        // Get or create salt
        let saltB64 = localStorage.getItem(this.SALT_KEY);
        let salt: Uint8Array;
        
        if (!saltB64) {
            salt = crypto.getRandomValues(new Uint8Array(16));
            localStorage.setItem(this.SALT_KEY, btoa(String.fromCharCode(...salt)));
        } else {
            const binary = atob(saltB64);
            salt = new Uint8Array(binary.length);
            for (let i = 0; i < binary.length; i++) {
                salt[i] = binary.charCodeAt(i);
            }
        }

        // Create device fingerprint (not perfect but reasonable)
        const fingerprint = [
            navigator.userAgent,
            navigator.language,
            new Date().getTimezoneOffset().toString(),
            screen.colorDepth.toString(),
            screen.width.toString(),
            screen.height.toString(),
        ].join('|');

        const encoder = new TextEncoder();
        const fingerprintKey = await crypto.subtle.importKey(
            'raw',
            encoder.encode(fingerprint),
            'PBKDF2',
            false,
            ['deriveBits', 'deriveKey']
        );

        this.deviceKey = await crypto.subtle.deriveKey(
            {
                name: 'PBKDF2',
                salt: salt,
                iterations: 100000,
                hash: 'SHA-256',
            },
            fingerprintKey,
            { name: 'AES-GCM', length: 256 },
            false,
            ['encrypt', 'decrypt']
        );

        return this.deviceKey;
    }

    /**
     * Store password encrypted with device key
     */
    static async storePassword(password: string): Promise<Result<void>> {
        try {
            logger.debug('Storing password securely');
            
            const deviceKey = await this.getDeviceKey();
            const encoder = new TextEncoder();
            const passwordData = encoder.encode(password);
            const nonce = crypto.getRandomValues(new Uint8Array(12));

            const encrypted = await crypto.subtle.encrypt(
                { name: 'AES-GCM', iv: nonce },
                deviceKey,
                passwordData
            );

            // Combine nonce + encrypted data
            const combined = new Uint8Array(nonce.length + encrypted.byteLength);
            combined.set(nonce, 0);
            combined.set(new Uint8Array(encrypted), nonce.length);

            const blob = btoa(String.fromCharCode(...combined));
            localStorage.setItem(this.STORAGE_KEY, blob);
            
            logger.info('Password stored successfully in encrypted localStorage');
            return { success: true, data: undefined };
        } catch (error) {
            logger.error('Failed to store password', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
            };
        }
    }

    /**
     * Retrieve and decrypt password
     */
    static async getPassword(): Promise<Result<string>> {
        try {
            const blob = localStorage.getItem(this.STORAGE_KEY);
            
            if (!blob) {
                // Check for migration from sessionStorage
                const oldPassword = sessionStorage.getItem('sync_password');
                if (oldPassword) {
                    logger.info('Migrating password from sessionStorage');
                    await this.storePassword(oldPassword);
                    sessionStorage.removeItem('sync_password');
                    return { success: true, data: oldPassword };
                }
                
                logger.debug('No password found in storage');
                return {
                    success: false,
                    error: 'No password found. Please set up sync.',
                };
            }

            const deviceKey = await this.getDeviceKey();
            const binary = atob(blob);
            const combined = new Uint8Array(binary.length);
            for (let i = 0; i < binary.length; i++) {
                combined[i] = binary.charCodeAt(i);
            }

            const nonce = combined.slice(0, 12);
            const encrypted = combined.slice(12);

            const decrypted = await crypto.subtle.decrypt(
                { name: 'AES-GCM', iv: nonce },
                deviceKey,
                encrypted
            );

            const decoder = new TextDecoder();
            const password = decoder.decode(decrypted);
            
            logger.debug('Password retrieved successfully');
            return { success: true, data: password };
        } catch (error) {
            logger.error('Failed to retrieve password', error);
            return {
                success: false,
                error: 'Failed to decrypt password. Storage may be corrupted.',
            };
        }
    }

    /**
     * Clear stored password (logout)
     */
    static async clearPassword(): Promise<Result<void>> {
        try {
            logger.debug('Clearing stored password');
            localStorage.removeItem(this.STORAGE_KEY);
            sessionStorage.removeItem('sync_password'); // Also clear old format
            logger.info('Password cleared successfully');
            return { success: true, data: undefined };
        } catch (error) {
            logger.error('Failed to clear password', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
            };
        }
    }

    /**
     * Check if password is stored
     */
    static async hasPassword(): Promise<boolean> {
        const hasNew = localStorage.getItem(this.STORAGE_KEY) !== null;
        const hasOld = sessionStorage.getItem('sync_password') !== null;
        return hasNew || hasOld;
    }
}
```

**Tests**: `packages/core/src/sync/CredentialStorage.test.ts`
```typescript
describe('CredentialStorage', () => {
    beforeEach(() => {
        localStorage.clear();
        sessionStorage.clear();
    });

    it('should store and retrieve password', async () => {
        const password = 'test-password-123';
        const storeResult = await CredentialStorage.storePassword(password);
        expect(storeResult.success).toBe(true);

        const getResult = await CredentialStorage.getPassword();
        expect(getResult.success).toBe(true);
        expect(getResult.data).toBe(password);
    });

    it('should migrate from sessionStorage', async () => {
        sessionStorage.setItem('sync_password', 'old-password');
        
        const result = await CredentialStorage.getPassword();
        expect(result.success).toBe(true);
        expect(result.data).toBe('old-password');
        
        // Should be migrated
        expect(sessionStorage.getItem('sync_password')).toBeNull();
        expect(localStorage.getItem(CredentialStorage['STORAGE_KEY'])).not.toBeNull();
    });

    it('should handle missing password', async () => {
        const result = await CredentialStorage.getPassword();
        expect(result.success).toBe(false);
        expect(result.error).toContain('No password found');
    });

    it('should clear password', async () => {
        await CredentialStorage.storePassword('test');
        const clearResult = await CredentialStorage.clearPassword();
        expect(clearResult.success).toBe(true);

        const getResult = await CredentialStorage.getPassword();
        expect(getResult.success).toBe(false);
    });
});
```

**Verification**:
```bash
cd packages/core && bun test CredentialStorage.test.ts
```

---

#### Task 1.2: Update SyncManager to Use CredentialStorage
**File**: `packages/core/src/managers/SyncManager.ts`

**Changes**:
- Remove `lastPassword` in-memory cache
- Use `CredentialStorage` for password persistence
- Update encryption initialization flow
- Fix encryption restoration on app startup

**Implementation**:
```typescript
// In SyncManager class

// REMOVE: private lastPassword: string | null = null;

/**
 * Initialize sync manager
 */
async init(): Promise<void> {
    this.logger.info('Initializing SyncManager...');

    // Load sync config
    const config = await this.app.configManager.loadConfig<SyncConfig>('sync');
    this.enabled = config?.enabled || false;

    this.baseURL = config?.serverUrl || 'http://localhost:8080/api/v1';
    this.wsURL = `${this.baseURL.replace(/\/api\/v1$/, '').replace(/^http/, 'ws')}/ws`;

    // Update service URLs
    this.authService.setBaseURL(this.baseURL);
    this.deviceManager.setBaseURL(this.baseURL);
    this.encryptionManager.setBaseURL(this.baseURL);

    // Load workspace links from config
    this.workspaceLinks = config?.workspaceLinks || [];
    this.currentWorkspaceId = config?.currentWorkspaceId;

    // Initialize selective sync
    await this.selectiveSync.init();

    // Initialize local database if enabled
    if (this.enabled) {
        try {
            await this.localDatabase.init(config?.localDbName);
            this.logger.debug('Local database initialized');
        } catch (error: any) {
            this.logger.error('Failed to initialize local database', error);
        }
    }

    // If enabled and has token, try to restore encryption session
    if (this.enabled && this.tokenManager.hasToken()) {
        if (this.tokenManager.isTokenExpired()) {
            await this.tryRefreshToken();
        }

        if (this.tokenManager.hasToken()) {
            // NEW: Try to restore using stored password (v2 flow)
            const passwordResult = await CredentialStorage.getPassword();
            
            if (passwordResult.success) {
                const restored = await this.encryptionManager.restoreFromPassword(
                    passwordResult.data
                );

                if (restored) {
                    this.logger.info('Encryption restored from stored password');
                    // Start sync in background
                    this.startSync().catch((err) => {
                        this.logger.error('Failed to start sync:', err);
                    });
                } else {
                    this.logger.warn('Failed to restore encryption - password may be incorrect');
                    await CredentialStorage.clearPassword(); // Clear corrupted password
                    this.app.workspace.triggerSyncUnlockRequired();
                }
            } else {
                this.logger.warn('No stored password - user needs to unlock');
                this.app.workspace.triggerSyncUnlockRequired();
            }
        }
    }

    this.logger.info(`SyncManager initialized (enabled: ${this.enabled})`);
}

/**
 * Setup encryption (first time or new device)
 */
async setupEncryption(password: string): Promise<void> {
    this.logger.info('Setting up encryption...');
    
    await this.encryptionManager.setupEncryption(password);
    
    // Store password securely
    const storeResult = await CredentialStorage.storePassword(password);
    if (!storeResult.success) {
        this.logger.error('Failed to store password:', storeResult.error);
        // Continue anyway - encryption is set up
    }
    
    this.logger.info('Encryption setup complete');
}

/**
 * Unlock encryption with password (on app restart or after logout)
 */
async unlockEncryption(password: string): Promise<void> {
    this.logger.info('Unlocking encryption...');
    
    // Check if keys exist on server
    const keysExist = await this.encryptionManager.checkKeysExistence();
    
    if (!keysExist) {
        throw new Error('No encryption keys found on server. Please set up encryption first.');
    }
    
    // Sync keys from server
    await this.encryptionManager.syncKeys(password);
    
    // Store password securely for future restores
    const storeResult = await CredentialStorage.storePassword(password);
    if (!storeResult.success) {
        this.logger.warn('Failed to store password:', storeResult.error);
    }
    
    // Start sync if enabled
    if (this.enabled && this.tokenManager.hasToken()) {
        await this.startSync();
    }
    
    this.logger.info('Encryption unlocked successfully');
}

/**
 * Logout - clear all credentials and encryption keys
 */
async logout(): Promise<void> {
    this.logger.info('Logging out...');

    // Stop sync first
    this.stopSync();

    // Clear password
    await CredentialStorage.clearPassword();

    // Clear encryption
    this.encryptionManager.clearKeys();
    this.encryptionManager.clearStorage();

    // Clear auth tokens
    this.tokenManager.clearToken();

    // Clear local database
    await this.localDatabase.clear();

    this.logger.info('Logout complete');
}

/**
 * Disable sync - keeps credentials but stops syncing
 */
async disable(): Promise<void> {
    this.logger.info('Disabling sync...');

    // Stop sync FIRST
    this.stopSync();

    this.enabled = false;
    
    // Do NOT clear password - user may re-enable sync later
    
    await this.saveConfig({ enabled: false });
}
```

**Verification Steps**:
1. Login and setup encryption with password
2. Close app and reopen
3. Verify encryption is automatically restored
4. Verify sync starts automatically
5. Test logout clears password
6. Test disable keeps password but stops sync

---

### Phase 2: Consistent Sync Engine Flow (Priority: HIGH)

#### Task 2.1: Implement Proper Startup Sync Sequence
**File**: `packages/core/src/sync/SyncEngine.ts`

**Problem**: File watcher starts before initial sync, causing race conditions

**Solution**: Implement startup sequence:
1. Fetch server state
2. Compare with local state  
3. Detect conflicts
4. Perform initial sync (download or upload)
5. Start file watcher AFTER initial sync

**Implementation**:
```typescript
// In SyncEngine class

private isStartupSyncComplete = false;

/**
 * Start sync engine with proper startup sequence
 */
async start(): Promise<void> {
    if (this.isActive()) {
        logger.warn('Sync engine already active');
        return;
    }

    logger.info('Starting sync engine...');
    this.activeFlag = true;
    this.isStartupSyncComplete = false;

    try {
        // Step 1: Perform initial sync BEFORE starting watchers
        logger.info('Performing startup sync...');
        await this.performStartupSync();
        this.isStartupSyncComplete = true;
        logger.info('Startup sync complete');

        // Step 2: Start file watcher AFTER startup sync
        logger.info('Starting file watcher...');
        await this.fileWatcher.start();

        // Step 3: Start WebSocket for real-time updates
        if (this.wsService) {
            logger.info('Connecting WebSocket...');
            await this.wsService.connect();
        }

        // Step 4: Start upload queue processor
        this.startUploadQueueProcessor();

        logger.info('Sync engine started successfully');
    } catch (error: any) {
        logger.error('Failed to start sync engine:', error);
        this.activeFlag = false;
        throw error;
    }
}

/**
 * Perform startup sync - reconcile local and server state
 */
private async performStartupSync(): Promise<void> {
    logger.info('=== STARTUP SYNC BEGIN ===');
    
    // Fetch all notes from server
    const serverNotes = await this.fetchAllServerNotes();
    logger.info(`Server has ${serverNotes.length} notes`);

    // Get all local notes
    const localFiles = this.app.workspace.getAllNotes();
    logger.info(`Local workspace has ${localFiles.length} notes`);

    // Build maps for comparison
    const serverMap = new Map(
        serverNotes.map(note => [note.id, note])
    );
    const localMap = new Map(
        localFiles.map(file => [file.id, file])
    );

    const toDownload: string[] = [];
    const toUpload: string[] = [];
    const conflicts: Array<{ noteId: string; path: string }> = [];

    // Check server notes
    for (const [noteId, serverNote] of serverMap) {
        const localFile = localMap.get(noteId);

        if (!localFile) {
            // Server has note, we don't -> download
            logger.debug(`Note ${noteId} only on server, will download`);
            toDownload.push(noteId);
        } else {
            // Both have the note -> check for conflicts
            const localHash = await this.calculateFileHash(localFile.path);
            
            if (serverNote.content_hash !== localHash) {
                // Content differs -> conflict
                logger.warn(`Conflict detected for ${localFile.path}`);
                conflicts.push({ noteId, path: localFile.path });
            } else {
                logger.debug(`Note ${localFile.path} in sync`);
            }
        }
    }

    // Check local notes
    for (const [noteId, localFile] of localMap) {
        if (!serverMap.has(noteId)) {
            // We have note, server doesn't -> upload
            logger.debug(`Note ${localFile.path} only local, will upload`);
            toUpload.push(localFile.path);
        }
    }

    logger.info(`Startup sync analysis:`);
    logger.info(`  - To download: ${toDownload.length}`);
    logger.info(`  - To upload: ${toUpload.length}`);
    logger.info(`  - Conflicts: ${conflicts.length}`);

    // Handle conflicts FIRST
    for (const conflict of conflicts) {
        await this.handleConflict(conflict.noteId, conflict.path);
    }

    // Download new notes
    for (const noteId of toDownload) {
        try {
            const serverNote = serverMap.get(noteId)!;
            await this.downloadNote(noteId, serverNote.path);
        } catch (error: any) {
            logger.error(`Failed to download ${noteId}:`, error);
        }
    }

    // Upload new notes
    for (const path of toUpload) {
        try {
            await this.uploadNote(path);
        } catch (error: any) {
            logger.error(`Failed to upload ${path}:`, error);
        }
    }

    logger.info('=== STARTUP SYNC COMPLETE ===');
}

/**
 * Handle conflict detection
 */
private async handleConflict(noteId: string, path: string): Promise<void> {
    logger.warn(`Handling conflict for ${path}`);

    // Fetch server version
    const serverNote = await this.fetchServerNote(noteId);
    
    // Read local version  
    const localContent = await this.app.vault.read(path);
    
    // Try automatic merge
    const merged = await this.conflictResolver.attemptAutoMerge(
        localContent,
        serverNote.decryptedContent,
        path
    );

    if (merged.success) {
        logger.info(`Auto-merged conflict for ${path}`);
        // Write merged content
        await this.app.vault.modify(path, merged.content);
        // Upload merged version
        await this.uploadNote(path);
    } else {
        logger.warn(`Cannot auto-merge ${path}, logging conflict for user`);
        // Log conflict for user resolution
        this.syncLogger.logConflict({
            id: `${noteId}-${Date.now()}`,
            noteId,
            path,
            localContent,
            serverContent: serverNote.decryptedContent,
            timestamp: new Date(),
            autoMergeAttempted: true,
            autoMergeFailed: true,
        });
    }
}

/**
 * Fetch all notes from server
 */
private async fetchAllServerNotes(): Promise<Array<{
    id: string;
    path: string;
    content_hash: string;
    updated_at: string;
}>> {
    return await this.tokenRefresh.withAuth(async (token) => {
        const response = await fetch(`${this.baseURL}/notes`, {
            headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch notes: ${response.statusText}`);
        }

        const result = await response.json();
        return result.data || [];
    });
}
```

**Tests**: `packages/core/src/sync/SyncEngine.test.ts`
```typescript
describe('SyncEngine - Startup Sync', () => {
    it('should download server-only notes', async () => {
        // Mock server with 1 note
        // Mock local with 0 notes
        // Start sync
        // Verify note downloaded
    });

    it('should upload local-only notes', async () => {
        // Mock server with 0 notes
        // Mock local with 1 note
        // Start sync
        // Verify note uploaded
    });

    it('should detect conflicts', async () => {
        // Mock server and local with same note ID but different content
        // Start sync
        // Verify conflict logged
    });

    it('should not start file watcher before startup sync', async () => {
        // Mock startup sync that takes 1 second
        // Verify file watcher not started during sync
        // Verify file watcher started after sync
    });
});
```

---

### Phase 3: Improved Conflict Resolution (Priority: MEDIUM)

#### Task 3.1: Three-Way Merge Implementation
**File**: `packages/core/src/sync/ConflictResolver.ts`

**Current State**: Has structure but no real merge logic

**Enhancements Needed**:
- Implement line-based three-way merge
- Detect non-conflicting changes
- Handle Markdown-specific conflicts (headings, lists)
- Provide clear conflict markers when auto-merge fails

**Implementation**:
```typescript
/**
 * Attempt automatic three-way merge
 */
async attemptAutoMerge(
    localContent: string,
    serverContent: string,
    path: string
): Promise<{ success: boolean; content: string; conflicts?: string[] }> {
    logger.info(`Attempting auto-merge for ${path}`);

    // Simple line-based merge
    const localLines = localContent.split('\n');
    const serverLines = serverContent.split('\n');

    // Check if one is superset of other (common case: one side just added content)
    if (this.isSuperset(localLines, serverLines)) {
        logger.info('Local is superset of server, using local');
        return { success: true, content: localContent };
    }

    if (this.isSuperset(serverLines, localLines)) {
        logger.info('Server is superset of local, using server');
        return { success: true, content: serverContent };
    }

    // Detect line-level changes
    const localChanges = this.detectChanges(serverLines, localLines);
    const serverChanges = this.detectChanges(localLines, serverLines);

    // Check for overlapping changes
    if (this.hasOverlap(localChanges, serverChanges)) {
        logger.warn('Overlapping changes detected, cannot auto-merge');
        
        // Generate conflict markers
        const conflictContent = this.generateConflictMarkers(
            localContent,
            serverContent,
            path
        );
        
        return {
            success: false,
            content: conflictContent,
            conflicts: ['Overlapping changes in same sections'],
        };
    }

    // Merge non-overlapping changes
    const merged = this.mergeChanges(localLines, serverLines, localChanges, serverChanges);
    
    logger.info('Auto-merge successful');
    return { success: true, content: merged.join('\n') };
}

/**
 * Check if array A is a superset of array B
 */
private isSuperset(a: string[], b: string[]): boolean {
    if (a.length < b.length) return false;
    
    // Try to find B as contiguous subsequence in A
    for (let i = 0; i <= a.length - b.length; i++) {
        let matches = true;
        for (let j = 0; j < b.length; j++) {
            if (a[i + j] !== b[j]) {
                matches = false;
                break;
            }
        }
        if (matches) return true;
    }
    
    return false;
}

/**
 * Generate conflict markers (Git-style)
 */
private generateConflictMarkers(
    localContent: string,
    serverContent: string,
    path: string
): string {
    return [
        `<<<<<<< LOCAL (${path})`,
        localContent,
        '=======',
        serverContent,
        `>>>>>>> SERVER (${path})`,
    ].join('\n');
}
```

---

### Phase 4: Integration & Testing (Priority: HIGH)

#### Task 4.1: End-to-End Integration Tests
**File**: `packages/core/src/sync/integration.test.ts`

**Test Scenarios**:
1. Fresh install → login → setup encryption → sync works
2. App restart → encryption auto-restores → sync auto-starts
3. Create note locally → syncs to server → appears on other device
4. Edit note on two devices → conflict detected → user resolves
5. Logout → password cleared → encryption cleared
6. Disable sync → password kept → re-enable works

---

### Phase 5: Server-Side Improvements (Priority: MEDIUM)

**Location**: `../../professional/inkdown-sync-server`

#### Task 5.1: Add Last-Modified Tracking
- Add `last_modified_by` field to notes
- Add `last_modified_device` field
- Return modification metadata in sync responses

#### Task 5.2: Implement Proper Conflict Detection
- Server should detect concurrent modifications
- Return 409 Conflict when version mismatch
- Provide both versions in conflict response

---

## Success Criteria

### Phase 1 (Password Persistence)
- ✅ Password persists across app restarts
- ✅ Encryption auto-restores on startup
- ✅ Secure encryption using device fingerprint
- ✅ Migration from old sessionStorage works
- ✅ All tests pass

### Phase 2 (Sync Consistency)
- ✅ Startup sync completes before file watcher starts
- ✅ Initial sync detects server-only notes and downloads
- ✅ Initial sync detects local-only notes and uploads
- ✅ Conflicts detected and logged properly
- ✅ No race conditions between local changes and sync

### Phase 3 (Conflict Resolution)
- ✅ Auto-merge works for non-overlapping changes
- ✅ Conflict markers generated when auto-merge fails
- ✅ User can resolve conflicts via UI
- ✅ Resolved conflicts sync correctly

### Phase 4 (Integration)
- ✅ All E2E tests pass
- ✅ Manual testing scenarios verified
- ✅ No data loss in any scenario

## Timeline Estimate

- Phase 1: 4-6 hours
- Phase 2: 6-8 hours  
- Phase 3: 4-6 hours
- Phase 4: 4-6 hours
- Phase 5: 4-6 hours (server-side)

**Total**: 22-32 hours

## Risk Mitigation

1. **Data Loss Risk**: 
   - Always keep local copy before overwriting
   - Log all sync operations for debugging
   - Implement rollback mechanism

2. **Password Corruption Risk**:
   - Multiple verification steps before storage
   - Fallback to manual password entry
   - Clear error messages for user

3. **Sync Loop Risk**:
   - Debounce file watcher events
   - Track operation IDs to prevent duplicates
   - Circuit breaker for repeated failures

## Next Steps

1. Review and approve this plan
2. Create feature branch: `feature/sync-system-refactor`
3. Implement Phase 1 with TDD
4. Review and test Phase 1
5. Proceed to Phase 2
6. Final integration testing
7. Deploy and monitor

