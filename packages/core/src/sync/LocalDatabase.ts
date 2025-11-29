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
            const request = indexedDB.open(this.dbName, 1);

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

                this.logger.debug('Upgrading IndexedDB schema');

                // Create object stores if they don't exist
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
}
