import { loggers } from '../utils/logger';

/**
 * In-memory cache for fast lookups
 */
interface LocalDatabaseCache {
    pathToNoteId: Map<string, string>;
    noteIdToPath: Map<string, string>;
    contentHashes: Map<string, string>;
    versions: Map<string, number>;
    initialized: boolean;
}

/**
 * LocalDatabase - Manages IndexedDB for offline note caching
 * Uses in-memory cache for fast lookups
 */
export class LocalDatabase {
    private logger = loggers.sync || loggers.app;
    private db?: IDBDatabase;
    private dbName = 'inkdown-sync-cache';

    // In-memory cache for fast lookups
    private cache: LocalDatabaseCache = {
        pathToNoteId: new Map(),
        noteIdToPath: new Map(),
        contentHashes: new Map(),
        versions: new Map(),
        initialized: false,
    };

    /**
     * Initialize local database
     */
    async init(customDbName?: string): Promise<void> {
        if (customDbName) {
            this.dbName = customDbName;
        }

        this.logger.debug(`Initializing IndexedDB: ${this.dbName}`);

        return new Promise((resolve, reject) => {
            const request = globalThis.indexedDB.open(this.dbName, 2); // Version 2 - added new stores

            request.onerror = () => {
                this.logger.error('Failed to open IndexedDB', request.error);
                reject(request.error);
            };

            request.onsuccess = async () => {
                this.db = request.result;
                this.logger.debug(`IndexedDB opened: ${this.dbName}`);

                // Load cache from DB
                try {
                    await this.loadCache();
                } catch (error: any) {
                    this.logger.error('Failed to load cache:', error);
                }

                resolve();
            };

            request.onupgradeneeded = (event) => {
                const db = (event.target as IDBOpenDBRequest).result;
                const oldVersion = event.oldVersion;

                this.logger.debug(
                    `Upgrading IndexedDB schema from v${oldVersion} to v${db.version}`,
                );

                // Version 1: notes and metadata stores
                if (oldVersion < 1) {
                    if (!db.objectStoreNames.contains('notes')) {
                        const notesStore = db.createObjectStore('notes', { keyPath: 'id' });
                        notesStore.createIndex('version', 'version', { unique: false });
                        notesStore.createIndex('updatedAt', 'updated_at', { unique: false });
                        this.logger.debug('Created "notes" object store');
                    }

                    if (!db.objectStoreNames.contains('metadata')) {
                        db.createObjectStore('metadata', { keyPath: 'key' });
                        this.logger.debug('Created "metadata" object store');
                    }
                }

                // Version 2: pathMappings and noteVersions stores
                if (oldVersion < 2) {
                    if (!db.objectStoreNames.contains('pathMappings')) {
                        const pathMappingsStore = db.createObjectStore('pathMappings', {
                            keyPath: 'path',
                        });
                        pathMappingsStore.createIndex('noteId', 'noteId', { unique: false });
                        this.logger.debug('Created "pathMappings" object store');
                    }

                    if (!db.objectStoreNames.contains('noteVersions')) {
                        const noteVersionsStore = db.createObjectStore('noteVersions', {
                            keyPath: 'path',
                        });
                        noteVersionsStore.createIndex('noteId', 'noteId', { unique: false });
                        this.logger.debug('Created "noteVersions" object store');
                    }
                }
            };
        });
    }

    /**
     * Load all mappings and versions into memory cache
     */
    private async loadCache(): Promise<void> {
        this.logger.debug('Loading cache from IndexedDB...');

        // Clear existing cache
        this.cache.pathToNoteId.clear();
        this.cache.noteIdToPath.clear();
        this.cache.contentHashes.clear();
        this.cache.versions.clear();

        // Load path mappings
        const mappings = await this.getAllPathMappings();
        for (const mapping of mappings) {
            this.cache.pathToNoteId.set(mapping.path, mapping.noteId);
            this.cache.noteIdToPath.set(mapping.noteId, mapping.path);
        }

        // Load versions and hashes
        const versions = await this.getAllNoteVersions();
        for (const v of versions) {
            if (v.version !== undefined) {
                this.cache.versions.set(v.path, v.version);
            }
            if (v.contentHash) {
                this.cache.contentHashes.set(v.path, v.contentHash);
            }
        }

        this.cache.initialized = true;
        this.logger.debug(
            `Cache loaded: ${this.cache.pathToNoteId.size} mappings, ${this.cache.versions.size} versions`,
        );
    }

    /**
     * Invalidate and reload cache
     */
    async reloadCache(): Promise<void> {
        await this.loadCache();
    }

    /**
     * Get noteId by path (uses cache for speed)
     */
    async getNoteIdByPath(path: string): Promise<string | undefined> {
        // Try cache first
        if (this.cache.initialized) {
            return this.cache.pathToNoteId.get(path);
        }
        // Fallback to DB
        const mapping = await this.getPathMapping(path);
        return mapping?.noteId;
    }

    /**
     * Get path by noteId (uses cache for speed)
     */
    async getPathByNoteId(noteId: string): Promise<string | undefined> {
        // Try cache first
        if (this.cache.initialized) {
            return this.cache.noteIdToPath.get(noteId);
        }
        // Fallback to DB query
        return this._getPathByNoteIdFromDB(noteId);
    }

    /**
     * Get content hash by path (uses cache for speed)
     */
    async getContentHash(path: string): Promise<string | undefined> {
        // Try cache first
        if (this.cache.initialized) {
            return this.cache.contentHashes.get(path);
        }
        // Fallback to DB
        return this._getContentHashFromDB(path);
    }

    /**
     * Get note version by path (uses cache for speed)
     */
    async getNoteVersion(path: string): Promise<number | undefined> {
        // Try cache first
        if (this.cache.initialized) {
            return this.cache.versions.get(path);
        }
        // Fallback to DB
        return this._getNoteVersionFromDB(path);
    }

    /**
     * Store note in local DB
     */
    async saveNote(note: any): Promise<void> {
        if (!this.db) throw new Error('Database not initialized');

        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction(['notes'], 'readwrite');
            const store = transaction.objectStore('notes');
            const request = store.put(note);

            request.onsuccess = () => {
                this.logger.debug(`Note saved to local DB: ${note.id}`);
                resolve();
            };
            request.onerror = () => {
                this.logger.error('Failed to save note', request.error);
                reject(request.error);
            };
        });
    }

    /**
     * Get note from local DB
     */
    async getNote(id: string): Promise<any> {
        if (!this.db) throw new Error('Database not initialized');

        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction(['notes'], 'readonly');
            const store = transaction.objectStore('notes');
            const request = store.get(id);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => {
                this.logger.error('Failed to get note', request.error);
                reject(request.error);
            };
        });
    }

    /**
     * Get all notes from local DB
     */
    async getAllNotes(): Promise<any[]> {
        if (!this.db) throw new Error('Database not initialized');

        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction(['notes'], 'readonly');
            const store = transaction.objectStore('notes');
            const request = store.getAll();

            request.onsuccess = () => {
                this.logger.debug(`Retrieved ${request.result.length} notes from local DB`);
                resolve(request.result);
            };
            request.onerror = () => {
                this.logger.error('Failed to get all notes', request.error);
                reject(request.error);
            };
        });
    }

    /**
     * Delete note from local DB
     */
    async deleteNote(id: string): Promise<void> {
        if (!this.db) throw new Error('Database not initialized');

        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction(['notes'], 'readwrite');
            const store = transaction.objectStore('notes');
            const request = store.delete(id);

            request.onsuccess = () => {
                this.logger.debug(`Note deleted from local DB: ${id}`);
                resolve();
            };
            request.onerror = () => {
                this.logger.error('Failed to delete note', request.error);
                reject(request.error);
            };
        });
    }

    /**
     * Clear all local data
     */
    async clear(): Promise<void> {
        if (!this.db) throw new Error('Database not initialized');

        this.logger.debug('Clearing all local database data');

        const transaction = this.db.transaction(['notes', 'metadata'], 'readwrite');

        await Promise.all([
            new Promise<void>((resolve, reject) => {
                const request = transaction.objectStore('notes').clear();
                request.onsuccess = () => resolve();
                request.onerror = () => reject(request.error);
            }),
            new Promise<void>((resolve, reject) => {
                const request = transaction.objectStore('metadata').clear();
                request.onsuccess = () => resolve();
                request.onerror = () => reject(request.error);
            }),
        ]);

        this.logger.debug('Local database cleared');
    }

    /**
     * Clear all path-to-note mappings and version tracking
     * Used when switching workspaces to avoid stale mappings
     */
    async clearAllMappings(): Promise<void> {
        if (!this.db) throw new Error('Database not initialized');

        this.logger.info('Clearing all path mappings and version data...');

        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction(
                ['pathMappings', 'noteVersions'],
                'readwrite'
            );
            
            const pathStore = transaction.objectStore('pathMappings');
            const versionStore = transaction.objectStore('noteVersions');
            
            pathStore.clear();
            versionStore.clear();
            
            transaction.oncomplete = () => {
                // Clear in-memory cache
                this.cache.pathToNoteId.clear();
                this.cache.noteIdToPath.clear();
                this.cache.contentHashes.clear();
                this.cache.versions.clear();
                this.logger.info('All mappings cleared');
                resolve();
            };
            
            transaction.onerror = () => {
                this.logger.error('Failed to clear mappings', transaction.error);
                reject(transaction.error);
            };
        });
    }

    /**
     * Change database name (re-initialize with new name)
     */
    async changeDatabaseName(newName: string): Promise<void> {
        this.logger.info(`Changing database name to: ${newName}`);

        if (this.db) {
            this.db.close();
            this.db = undefined;
        }

        await this.init(newName);
    }

    /**
     * Get database statistics
     */
    async getStats(): Promise<{ noteCount: number; dbName: string }> {
        const notes = await this.getAllNotes();
        return {
            noteCount: notes.length,
            dbName: this.dbName,
        };
    }

    // ========== Path Mapping Methods ==========

    /**
     * Save path to noteId mapping (updates cache)
     */
    async savePathMapping(path: string, noteId: string): Promise<void> {
        if (!this.db) throw new Error('Database not initialized');

        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction(['pathMappings'], 'readwrite');
            const store = transaction.objectStore('pathMappings');
            const request = store.put({ path, noteId, updatedAt: new Date() });

            request.onsuccess = () => {
                // Update cache
                this.cache.pathToNoteId.set(path, noteId);
                this.cache.noteIdToPath.set(noteId, path);
                this.logger.debug(`Path mapping saved: ${path} → ${noteId}`);
                resolve();
            };
            request.onerror = () => {
                this.logger.error('Failed to save path mapping', request.error);
                reject(request.error);
            };
        });
    }

    /**
     * Get path mapping by path (internal, for DB access)
     */
    async getPathMapping(path: string): Promise<{ path: string; noteId: string } | undefined> {
        if (!this.db) throw new Error('Database not initialized');

        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction(['pathMappings'], 'readonly');
            const store = transaction.objectStore('pathMappings');
            const request = store.get(path);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => {
                this.logger.error('Failed to get path mapping', request.error);
                reject(request.error);
            };
        });
    }

    /**
     * Get path by noteId from DB (internal fallback)
     */
    private async _getPathByNoteIdFromDB(noteId: string): Promise<string | undefined> {
        if (!this.db) throw new Error('Database not initialized');

        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction(['pathMappings'], 'readonly');
            const store = transaction.objectStore('pathMappings');
            const index = store.index('noteId');
            const request = index.get(noteId);

            request.onsuccess = () => resolve(request.result?.path);
            request.onerror = () => {
                this.logger.error('Failed to get path by noteId', request.error);
                reject(request.error);
            };
        });
    }

    /**
     * Delete path mapping (updates cache)
     */
    async deletePathMapping(path: string): Promise<void> {
        if (!this.db) throw new Error('Database not initialized');

        // Get noteId before deleting to update cache
        const noteId = this.cache.pathToNoteId.get(path);

        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction(['pathMappings'], 'readwrite');
            const store = transaction.objectStore('pathMappings');
            const request = store.delete(path);

            request.onsuccess = () => {
                // Update cache
                this.cache.pathToNoteId.delete(path);
                if (noteId) {
                    this.cache.noteIdToPath.delete(noteId);
                }
                this.logger.debug(`Path mapping deleted: ${path}`);
                resolve();
            };
            request.onerror = () => {
                this.logger.error('Failed to delete path mapping', request.error);
                reject(request.error);
            };
        });
    }

    /**
     * Update path mapping when a file is renamed
     * This atomically: deletes old path mapping, creates new mapping, transfers version data
     */
    async updatePathMapping(oldPath: string, newPath: string, noteId: string): Promise<void> {
        if (!this.db) throw new Error('Database not initialized');

        this.logger.debug(`Updating path mapping: ${oldPath} → ${newPath} (noteId: ${noteId})`);

        // Get existing version data before deleting
        const existingVersion = await this.getNoteVersion(oldPath);
        const existingHash = await this.getContentHash(oldPath);
        const hasVersionData = existingVersion !== undefined || existingHash !== undefined;

        return new Promise((resolve, reject) => {
            // Only include noteVersions store if we have version data to transfer
            const stores: ('pathMappings' | 'noteVersions')[] = hasVersionData 
                ? ['pathMappings', 'noteVersions'] 
                : ['pathMappings'];
            const transaction = this.db!.transaction(stores, 'readwrite');

            transaction.onerror = (event) => {
                this.logger.error('Failed to update path mapping', transaction.error);
                reject(transaction.error);
            };

            transaction.onabort = (event) => {
                this.logger.error('Transaction aborted', transaction.error);
                reject(new Error('Transaction aborted'));
            };

            transaction.oncomplete = () => {
                // Update caches after transaction completes
                this.cache.pathToNoteId.delete(oldPath);
                this.cache.pathToNoteId.set(newPath, noteId);
                this.cache.noteIdToPath.set(noteId, newPath);
                
                if (existingVersion !== undefined) {
                    this.cache.versions.set(newPath, existingVersion);
                    this.cache.versions.delete(oldPath);
                }
                
                if (existingHash !== undefined) {
                    this.cache.contentHashes.set(newPath, existingHash);
                    this.cache.contentHashes.delete(oldPath);
                }

                this.logger.debug(`Path mapping updated successfully: ${oldPath} → ${newPath}`);
                resolve();
            };

            // Delete old path mapping
            const pathMappingsStore = transaction.objectStore('pathMappings');
            pathMappingsStore.delete(oldPath);

            // Create new path mapping
            pathMappingsStore.put({ path: newPath, noteId, updatedAt: new Date() });

            // Handle version data transfer if it exists
            if (hasVersionData) {
                const noteVersionsStore = transaction.objectStore('noteVersions');
                
                // Delete old version entry
                noteVersionsStore.delete(oldPath);

                // Create new version entry
                noteVersionsStore.put({
                    path: newPath,
                    version: existingVersion || 0,
                    noteId,
                    contentHash: existingHash || '',
                    updatedAt: new Date(),
                });
            }
        });
    }

    /**
     * Get all path mappings
     */
    async getAllPathMappings(): Promise<{ path: string; noteId: string }[]> {
        if (!this.db) throw new Error('Database not initialized');

        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction(['pathMappings'], 'readonly');
            const store = transaction.objectStore('pathMappings');
            const request = store.getAll();

            request.onsuccess = () => {
                this.logger.debug(`Retrieved ${request.result.length} path mappings`);
                resolve(request.result);
            };
            request.onerror = () => {
                this.logger.error('Failed to get all path mappings', request.error);
                reject(request.error);
            };
        });
    }

    // ========== Note Version Methods ==========

    /**
     * Save note version with content hash (updates cache)
     */
    async saveNoteVersion(
        path: string,
        version: number,
        noteId: string,
        contentHash?: string,
    ): Promise<void> {
        if (!this.db) throw new Error('Database not initialized');

        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction(['noteVersions'], 'readwrite');
            const store = transaction.objectStore('noteVersions');
            const request = store.put({
                path,
                version,
                noteId,
                contentHash,
                updatedAt: new Date(),
            });

            request.onsuccess = () => {
                // Update cache
                this.cache.versions.set(path, version);
                if (contentHash) {
                    this.cache.contentHashes.set(path, contentHash);
                }
                this.logger.debug(`Note version saved: ${path} → v${version}`);
                resolve();
            };
            request.onerror = () => {
                this.logger.error('Failed to save note version', request.error);
                reject(request.error);
            };
        });
    }

    /**
     * Get note version from DB (internal fallback)
     */
    private async _getNoteVersionFromDB(path: string): Promise<number | undefined> {
        if (!this.db) throw new Error('Database not initialized');

        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction(['noteVersions'], 'readonly');
            const store = transaction.objectStore('noteVersions');
            const request = store.get(path);

            request.onsuccess = () => resolve(request.result?.version);
            request.onerror = () => {
                this.logger.error('Failed to get note version', request.error);
                reject(request.error);
            };
        });
    }

    /**
     * Get content hash from DB (internal fallback)
     */
    private async _getContentHashFromDB(path: string): Promise<string | undefined> {
        if (!this.db) throw new Error('Database not initialized');

        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction(['noteVersions'], 'readonly');
            const store = transaction.objectStore('noteVersions');
            const request = store.get(path);

            request.onsuccess = () => resolve(request.result?.contentHash);
            request.onerror = () => {
                this.logger.error('Failed to get content hash', request.error);
                reject(request.error);
            };
        });
    }

    /**
     * Update content hash for a path (updates cache)
     */
    async updateContentHash(path: string, contentHash: string): Promise<void> {
        if (!this.db) throw new Error('Database not initialized');

        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction(['noteVersions'], 'readwrite');
            const store = transaction.objectStore('noteVersions');
            const getRequest = store.get(path);

            getRequest.onsuccess = () => {
                const existing = getRequest.result;
                if (existing) {
                    existing.contentHash = contentHash;
                    existing.updatedAt = new Date();
                    const putRequest = store.put(existing);
                    putRequest.onsuccess = () => {
                        // Update cache
                        this.cache.contentHashes.set(path, contentHash);
                        this.logger.debug(`Content hash updated for: ${path}`);
                        resolve();
                    };
                    putRequest.onerror = () => reject(putRequest.error);
                } else {
                    // Create new entry if doesn't exist
                    const putRequest = store.put({ path, contentHash, updatedAt: new Date() });
                    putRequest.onsuccess = () => {
                        // Update cache
                        this.cache.contentHashes.set(path, contentHash);
                        this.logger.debug(`Content hash created for: ${path}`);
                        resolve();
                    };
                    putRequest.onerror = () => reject(putRequest.error);
                }
            };
            getRequest.onerror = () => reject(getRequest.error);
        });
    }

    /**
     * Delete note version (updates cache)
     */
    async deleteNoteVersion(path: string): Promise<void> {
        if (!this.db) throw new Error('Database not initialized');

        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction(['noteVersions'], 'readwrite');
            const store = transaction.objectStore('noteVersions');
            const request = store.delete(path);

            request.onsuccess = () => {
                // Update cache
                this.cache.versions.delete(path);
                this.cache.contentHashes.delete(path);
                this.logger.debug(`Note version deleted: ${path}`);
                resolve();
            };
            request.onerror = () => {
                this.logger.error('Failed to delete note version', request.error);
                reject(request.error);
            };
        });
    }

    /**
     * Get all note versions
     */
    async getAllNoteVersions(): Promise<
        { path: string; version: number; noteId: string; contentHash?: string }[]
    > {
        if (!this.db) throw new Error('Database not initialized');

        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction(['noteVersions'], 'readonly');
            const store = transaction.objectStore('noteVersions');
            const request = store.getAll();

            request.onsuccess = () => {
                this.logger.debug(`Retrieved ${request.result.length} note versions`);
                resolve(request.result);
            };
            request.onerror = () => {
                this.logger.error('Failed to get all note versions', request.error);
                reject(request.error);
            };
        });
    }
}
