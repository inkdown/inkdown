import { loggers } from '../utils/logger';

/**
 * LocalDatabase - Manages IndexedDB for offline note caching
 */
export class LocalDatabase {
    private logger = loggers.sync || loggers.app;
    private db?: IDBDatabase;
    private dbName: string = 'inkdown-sync-cache';

    /**
     * Initialize local database
     */
    async init(customDbName?: string): Promise<void> {
        if (customDbName) {
            this.dbName = customDbName;
        }

        this.logger.debug(`Initializing IndexedDB: ${this.dbName}`);

        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, 2);  // Version 2 - added new stores

            request.onerror = () => {
                this.logger.error('Failed to open IndexedDB', request.error);
                reject(request.error);
            };

            request.onsuccess = () => {
                this.db = request.result;
                this.logger.debug(`IndexedDB opened: ${this.dbName}`);
                resolve();
            };

            request.onupgradeneeded = (event) => {
                const db = (event.target as IDBOpenDBRequest).result;
                const oldVersion = event.oldVersion;

                this.logger.debug(`Upgrading IndexedDB schema from v${oldVersion} to v${db.version}`);

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
                        const pathMappingsStore = db.createObjectStore('pathMappings', { keyPath: 'path' });
                        pathMappingsStore.createIndex('noteId', 'noteId', { unique: false });
                        this.logger.debug('Created "pathMappings" object store');
                    }

                    if (!db.objectStoreNames.contains('noteVersions')) {
                        const noteVersionsStore = db.createObjectStore('noteVersions', { keyPath: 'path' });
                        noteVersionsStore.createIndex('noteId', 'noteId', { unique: false });
                        this.logger.debug('Created "noteVersions" object store');
                    }
                }
            };
        });
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
     * Save path to noteId mapping
     */
    async savePathMapping(path: string, noteId: string): Promise<void> {
        if (!this.db) throw new Error('Database not initialized');

        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction(['pathMappings'], 'readwrite');
            const store = transaction.objectStore('pathMappings');
            const request = store.put({ path, noteId, updatedAt: new Date() });

            request.onsuccess = () => {
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
     * Get path mapping by path
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
     * Get noteId by path
     */
    async getNoteIdByPath(path: string): Promise<string | undefined> {
        const mapping = await this.getPathMapping(path);
        return mapping?.noteId;
    }

    /**
     * Get path by noteId
     */
    async getPathByNoteId(noteId: string): Promise<string | undefined> {
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
     * Delete path mapping
     */
    async deletePathMapping(path: string): Promise<void> {
        if (!this.db) throw new Error('Database not initialized');

        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction(['pathMappings'], 'readwrite');
            const store = transaction.objectStore('pathMappings');
            const request = store.delete(path);

            request.onsuccess = () => {
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
     * Save note version with content hash
     */
    async saveNoteVersion(path: string, version: number, noteId: string, contentHash?: string): Promise<void> {
        if (!this.db) throw new Error('Database not initialized');

        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction(['noteVersions'], 'readwrite');
            const store = transaction.objectStore('noteVersions');
            const request = store.put({ path, version, noteId, contentHash, updatedAt: new Date() });

            request.onsuccess = () => {
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
     * Get note version by path
     */
    async getNoteVersion(path: string): Promise<number | undefined> {
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
     * Get content hash by path
     */
    async getContentHash(path: string): Promise<string | undefined> {
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
     * Update content hash for a path
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
                        this.logger.debug(`Content hash updated for: ${path}`);
                        resolve();
                    };
                    putRequest.onerror = () => reject(putRequest.error);
                } else {
                    // Create new entry if doesn't exist
                    const putRequest = store.put({ path, contentHash, updatedAt: new Date() });
                    putRequest.onsuccess = () => {
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
     * Delete note version
     */
    async deleteNoteVersion(path: string): Promise<void> {
        if (!this.db) throw new Error('Database not initialized');

        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction(['noteVersions'], 'readwrite');
            const store = transaction.objectStore('noteVersions');
            const request = store.delete(path);

            request.onsuccess = () => {
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
    async getAllNoteVersions(): Promise<{ path: string; version: number; noteId: string }[]> {
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
