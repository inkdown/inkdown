import type { EncryptedData, EncryptionKeys, KeySyncResponse } from './types';
import type { TokenRefreshService } from './TokenRefreshService';

/**
 * EncryptionManager - Handles E2EE encryption/decryption using Web Crypto API
 * Uses AES-256-GCM for symmetric encryption
 */
export class EncryptionManager {
    private masterKey: CryptoKey | null = null;
    private baseURL: string;
    private tokenRefresh: TokenRefreshService | null = null;

    constructor(baseURL: string = 'http://localhost:8080/api/v1') {
        this.baseURL = baseURL;
    }

    /**
     * Update the base URL for API requests
     */
    setBaseURL(url: string): void {
        this.baseURL = url;
    }

    /**
     * Set token refresh service (injected by SyncManager)
     */
    setTokenRefreshService(service: TokenRefreshService): void {
        this.tokenRefresh = service;
    }

    /**
     * Derive master key from password using PBKDF2
     * (Simplified version - in production, use Argon2id)
     */
    private async deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
        const encoder = new TextEncoder();
        const passwordKey = await crypto.subtle.importKey(
            'raw',
            encoder.encode(password),
            'PBKDF2',
            false,
            ['deriveBits', 'deriveKey']
        );

        return crypto.subtle.deriveKey(
            {
                name: 'PBKDF2',
                salt: salt as any,
                iterations: 100000, // High iteration count
                hash: 'SHA-256',
            },
            passwordKey,
            { name: 'AES-GCM', length: 256 },
            true, // extractable
            ['encrypt', 'decrypt']
        );
    }

    /**
     * Generate random salt
     */
    private generateSalt(): Uint8Array {
        return crypto.getRandomValues(new Uint8Array(16));
    }

    /**
     * Generate random nonce/IV for AES-GCM
     */
    private generateNonce(): Uint8Array {
        return crypto.getRandomValues(new Uint8Array(12)); // 96 bits for GCM
    }

    /**
     * Convert BufferSource to base64 string
     */
    private arrayBufferToBase64(buffer: any): string {
        const bytes = new Uint8Array(buffer);
        let binary = '';
        for (let i = 0; i < bytes.length; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return btoa(binary);
    }

    /**
     * Convert base64 string to Uint8Array
     */
    private base64ToArrayBuffer(base64: string): Uint8Array {
        const binary = atob(base64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
            bytes[i] = binary.charCodeAt(i);
        }
        return bytes;
    }

    /**
     * Calculate SHA-256 hash of content
     */
    private async calculateHash(content: string): Promise<string> {
        const encoder = new TextEncoder();
        const data = encoder.encode(content);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        return this.arrayBufferToBase64(hashBuffer);
    }

    /**
     * Derive a session key from the access token
     * This key is used to encrypt the master key for storage in sessionStorage
     */
    private async deriveSessionKey(accessToken: string): Promise<CryptoKey> {
        const encoder = new TextEncoder();
        const tokenData = encoder.encode(accessToken);

        // Hash the token to get consistent key material
        const hashBuffer = await crypto.subtle.digest('SHA-256', tokenData);

        // Import as encryption key
        return crypto.subtle.importKey(
            'raw',
            hashBuffer,
            { name: 'AES-GCM', length: 256 },
            false,
            ['encrypt', 'decrypt']
        );
    }

    /**
     * Save encrypted master key to local storage
     * This allows the app to restore encryption after restart without asking for password
     */
    async saveToStorage(accessToken: string): Promise<void> {
        if (!this.masterKey) {
            throw new Error('Master key not initialized');
        }

        console.log('[EncryptionManager] Saving encrypted key to storage...');

        try {
            // Export master key
            const exported = await crypto.subtle.exportKey('raw', this.masterKey);

            // Derive session key from token
            const sessionKey = await this.deriveSessionKey(accessToken);

            // Encrypt master key
            const nonce = this.generateNonce();
            const encrypted = await crypto.subtle.encrypt(
                { name: 'AES-GCM', iv: nonce as any },
                sessionKey,
                exported
            );

            // Concatenate nonce + encrypted data
            const blob = new Uint8Array(nonce.length + encrypted.byteLength);
            blob.set(nonce, 0);
            blob.set(new Uint8Array(encrypted), nonce.length);

            // Store in localStorage
            localStorage.setItem('inkdown-encrypted-master-key',
                this.arrayBufferToBase64(blob));

            console.log('[EncryptionManager] Key saved successfully');
        } catch (error) {
            console.error('[EncryptionManager] Failed to save key:', error);
            throw error;
        }
    }

    /**
     * Try to restore master key from local storage
     * Returns true if successful, false otherwise
     */
    async restoreFromStorage(accessToken: string): Promise<boolean> {
        const storedData = localStorage.getItem('inkdown-encrypted-master-key');
        if (!storedData) {
            console.log('[EncryptionManager] No stored key found');
            return false;
        }

        console.log('[EncryptionManager] Attempting to restore key from storage...');

        try {
            const blob = this.base64ToArrayBuffer(storedData);
            const nonce = blob.slice(0, 12);
            const encrypted = blob.slice(12);

            // Derive session key from token
            const sessionKey = await this.deriveSessionKey(accessToken);

            // Decrypt master key
            const decrypted = await crypto.subtle.decrypt(
                { name: 'AES-GCM', iv: nonce as any },
                sessionKey,
                encrypted as any
            );

            // Import master key
            this.masterKey = await crypto.subtle.importKey(
                'raw',
                decrypted,
                { name: 'AES-GCM', length: 256 },
                true,
                ['encrypt', 'decrypt']
            );

            console.log('[EncryptionManager] Key restored successfully');
            return true;
        } catch (error) {
            console.error('[EncryptionManager] Failed to restore key:', error);
            // Clear invalid session data
            localStorage.removeItem('inkdown-encrypted-master-key');
            return false;
        }
    }

    /**
     * Clear key from storage (e.g., on logout)
     */
    clearStorage(): void {
        localStorage.removeItem('inkdown-encrypted-master-key');
        console.log('[EncryptionManager] Storage cleared');
    }

    /**
     * Setup encryption for first time (after registration/login)
     * Generates master key and uploads to server
     */
    async setupEncryption(password: string): Promise<void> {
        if (!this.tokenRefresh) {
            throw new Error('TokenRefreshService not initialized');
        }

        console.log('[EncryptionManager] Setting up encryption...');

        // Generate salt and derive master key
        const salt = this.generateSalt();
        this.masterKey = await this.deriveKey(password, salt);

        // Export master key to encrypt it
        const exportedKey = await crypto.subtle.exportKey('raw', this.masterKey);

        // Encrypt the master key with the derived key (self-encryption)
        const nonce = this.generateNonce();
        const encryptedKeyBuffer = await crypto.subtle.encrypt(
            { name: 'AES-GCM', iv: nonce as any },
            this.masterKey,
            exportedKey
        );

        // Concatenate nonce + encrypted data for storage
        // This ensures we can retrieve the same nonce when decrypting
        const encryptedWithNonce = new Uint8Array(nonce.length + encryptedKeyBuffer.byteLength);
        encryptedWithNonce.set(nonce, 0);
        encryptedWithNonce.set(new Uint8Array(encryptedKeyBuffer), nonce.length);

        // Prepare payload for server
        const payload: EncryptionKeys = {
            encrypted_key: this.arrayBufferToBase64(encryptedWithNonce),
            key_salt: this.arrayBufferToBase64(salt),
            kdf_params: JSON.stringify({
                algorithm: 'PBKDF2', // In production: Argon2id
                iterations: 100000,
                hash: 'SHA-256',
            }),
            encryption_algo: 'AES-256-GCM',
        };

        // Upload to server with automatic token refresh
        await this.tokenRefresh.withAuth(async (token) => {
            const response = await fetch(`${this.baseURL}/security/keys/setup`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                const error = await response.text();
                throw new Error(`Failed to setup encryption keys: ${error}`);
            }

            // Save to local storage for persistence
            await this.saveToStorage(token);
        });

        console.log('[EncryptionManager] Encryption setup complete');
    }

    /**
     * Check if keys exist on server
     */
    async checkKeysExistence(): Promise<boolean> {
        if (!this.tokenRefresh) {
            return false;
        }

        try {
            return await this.tokenRefresh.withAuth(async (token) => {
                const response = await fetch(`${this.baseURL}/security/keys/sync`, {
                    method: 'GET',
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });
                return response.ok;
            });
        } catch (error) {
            console.error('[EncryptionManager] Failed to check key existence:', error);
            return false;
        }
    }

    /**
     * Sync encryption keys from server (after login on new device)
     */
    async syncKeys(password: string): Promise<void> {
        if (!this.tokenRefresh) {
            throw new Error('TokenRefreshService not initialized');
        }

        console.log('[EncryptionManager] Syncing encryption keys...');

        let accessToken = '';

        const keys = await this.tokenRefresh.withAuth(async (token) => {
            accessToken = token;
            const response = await fetch(`${this.baseURL}/security/keys/sync`, {
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                const error = await response.text();
                throw new Error(`Failed to sync encryption keys: ${error}`);
            }

            const result: KeySyncResponse = await response.json();
            return result.data;
        });

        // Derive key from password and salt
        const salt = this.base64ToArrayBuffer(keys.key_salt);
        const derivedKey = await this.deriveKey(password, salt);

        // Extract nonce and encrypted key from the blob
        // Format: [12 bytes nonce][encrypted data]
        const encryptedBlob = this.base64ToArrayBuffer(keys.encrypted_key);

        if (encryptedBlob.length < 12) {
            throw new Error('Invalid encrypted key format');
        }

        const nonce = encryptedBlob.slice(0, 12);
        const encryptedKey = encryptedBlob.slice(12);

        try {
            const decryptedKeyBuffer = await crypto.subtle.decrypt(
                { name: 'AES-GCM', iv: nonce as any },
                derivedKey,
                encryptedKey as any
            );

            // Import the decrypted master key
            this.masterKey = await crypto.subtle.importKey(
                'raw',
                decryptedKeyBuffer,
                { name: 'AES-GCM', length: 256 },
                true,
                ['encrypt', 'decrypt']
            );

            // Save to local storage for persistence
            if (accessToken) {
                await this.saveToStorage(accessToken);
            }

            console.log('[EncryptionManager] Keys synced successfully');
        } catch (error) {
            console.error('[EncryptionManager] Failed to decrypt master key:', error);
            throw new Error('Failed to decrypt master key - incorrect password?');
        }
    }

    /**
     * Encrypt text content
     */
    async encrypt(content: string): Promise<EncryptedData> {
        if (!this.masterKey) {
            throw new Error('Master key not initialized. Call setupEncryption or syncKeys first.');
        }

        const encoder = new TextEncoder();
        const data = encoder.encode(content);
        const nonce = this.generateNonce();

        const encryptedBuffer = await crypto.subtle.encrypt(
            { name: 'AES-GCM', iv: nonce as any },
            this.masterKey,
            data
        );

        return {
            encrypted_content: this.arrayBufferToBase64(encryptedBuffer),
            nonce: this.arrayBufferToBase64(nonce),
            encryption_algo: 'AES-256-GCM',
        };
    }

    /**
     * Encrypt text content with nonce embedded in the output
     * Format: [12 bytes nonce][encrypted data]
     * This is self-contained and doesn't require separate nonce storage
     */
    async encryptBlob(content: string): Promise<string> {
        if (!this.masterKey) {
            throw new Error('Master key not initialized. Call setupEncryption or syncKeys first.');
        }

        const encoder = new TextEncoder();
        const data = encoder.encode(content);
        const nonce = this.generateNonce();

        const encryptedBuffer = await crypto.subtle.encrypt(
            { name: 'AES-GCM', iv: nonce as any },
            this.masterKey,
            data
        );

        // Concatenate nonce + encrypted data
        const combined = new Uint8Array(nonce.length + encryptedBuffer.byteLength);
        combined.set(nonce, 0);
        combined.set(new Uint8Array(encryptedBuffer), nonce.length);

        return this.arrayBufferToBase64(combined);
    }

    /**
     * Decrypt blob that has nonce embedded at the start
     * Format: [12 bytes nonce][encrypted data]
     */
    async decryptBlob(encryptedBlob: string): Promise<string> {
        if (!this.masterKey) {
            throw new Error('Master key not initialized');
        }

        const combined = this.base64ToArrayBuffer(encryptedBlob);
        
        if (combined.byteLength < 12) {
            throw new Error('Invalid encrypted blob: too short');
        }

        const nonce = combined.slice(0, 12);
        const encryptedData = combined.slice(12);

        const decryptedBuffer = await crypto.subtle.decrypt(
            { name: 'AES-GCM', iv: nonce as any },
            this.masterKey,
            encryptedData as any
        );

        const decoder = new TextDecoder();
        return decoder.decode(decryptedBuffer);
    }

    /**
     * Decrypt encrypted content
     */
    async decrypt(encryptedData: EncryptedData): Promise<string> {
        if (!this.masterKey) {
            throw new Error('Master key not initialized');
        }

        const encryptedBuffer = this.base64ToArrayBuffer(encryptedData.encrypted_content);
        const nonce = this.base64ToArrayBuffer(encryptedData.nonce);

        const decryptedBuffer = await crypto.subtle.decrypt(
            { name: 'AES-GCM', iv: nonce as any },
            this.masterKey,
            encryptedBuffer as any
        );

        const decoder = new TextDecoder();
        return decoder.decode(decryptedBuffer);
    }

    /**
     * Encrypt note title
     */
    async encryptTitle(title: string): Promise<string> {
        const encrypted = await this.encrypt(title);
        return encrypted.encrypted_content;
    }

    /**
     * Decrypt note title
     */
    async decryptTitle(encryptedTitle: string, nonce: string): Promise<string> {
        return this.decrypt({
            encrypted_content: encryptedTitle,
            nonce: nonce,
            encryption_algo: 'AES-256-GCM',
        });
    }

    /**
     * Encrypt entire note (title + content)
     * SECURITY: Combines title and content into single encrypted blob to avoid nonce reuse
     */
    async encryptNote(title: string, content: string): Promise<{
        encrypted_title: string;
        encrypted_content: string;
        nonce: string;
        content_hash: string;
    }> {
        if (!this.masterKey) {
            throw new Error('Master key not initialized');
        }

        // SECURITY FIX: Combine title and content into single blob before encryption
        // This prevents nonce reuse vulnerability with AES-GCM
        const combinedData = JSON.stringify({
            title: title,
            content: content,
        });

        const nonce = this.generateNonce();
        const encoder = new TextEncoder();
        const data = encoder.encode(combinedData);

        const encryptedBuffer = await crypto.subtle.encrypt(
            { name: 'AES-GCM', iv: nonce as any },
            this.masterKey,
            data
        );

        const encryptedBase64 = this.arrayBufferToBase64(encryptedBuffer);

        // Calculate hash of plaintext content
        const contentHash = await this.calculateHash(content);

        // For backward compatibility with server API:
        // - encrypted_title: stores the combined encrypted blob
        // - encrypted_content: empty string (data is in encrypted_title)
        return {
            encrypted_title: encryptedBase64,
            encrypted_content: '', // Kept for API compatibility
            nonce: this.arrayBufferToBase64(nonce),
            content_hash: contentHash,
        };
    }


    /**
     * Decrypt entire note
     * Supports both new format (combined blob) and legacy format (separate fields)
     */
    async decryptNote(encryptedNote: {
        encrypted_title: string;
        encrypted_content: string;
        nonce: string;
    }): Promise<{ title: string; content: string }> {
        if (!this.masterKey) {
            throw new Error('Master key not initialized');
        }

        const nonce = this.base64ToArrayBuffer(encryptedNote.nonce);
        const decoder = new TextDecoder();

        // Check if using new format (encrypted_content is empty)
        if (!encryptedNote.encrypted_content || encryptedNote.encrypted_content === '') {
            // NEW FORMAT: Combined encryption
            const encryptedBuffer = this.base64ToArrayBuffer(encryptedNote.encrypted_title);
            const decryptedBuffer = await crypto.subtle.decrypt(
                { name: 'AES-GCM', iv: nonce as any },
                this.masterKey,
                encryptedBuffer as any
            );
            const combinedData = decoder.decode(decryptedBuffer);

            try {
                const parsed = JSON.parse(combinedData);
                return {
                    title: parsed.title || '',
                    content: parsed.content || '',
                };
            } catch (error) {
                console.error('[EncryptionManager] Failed to parse combined data:', error);
                throw new Error('Failed to decrypt note: invalid format');
            }
        } else {
            // LEGACY FORMAT: Separate title and content encryption
            // Decrypt title
            const encryptedTitleBuffer = this.base64ToArrayBuffer(encryptedNote.encrypted_title);
            const decryptedTitleBuffer = await crypto.subtle.decrypt(
                { name: 'AES-GCM', iv: nonce as any },
                this.masterKey,
                encryptedTitleBuffer as any
            );
            const title = decoder.decode(decryptedTitleBuffer);

            // Decrypt content
            const encryptedContentBuffer = this.base64ToArrayBuffer(encryptedNote.encrypted_content);
            const decryptedContentBuffer = await crypto.subtle.decrypt(
                { name: 'AES-GCM', iv: nonce as any },
                this.masterKey,
                encryptedContentBuffer as any
            );
            const content = decoder.decode(decryptedContentBuffer);

            return { title, content };
        }
    }

    /**
     * Check if encryption is initialized
     */
    isInitialized(): boolean {
        return this.masterKey !== null;
    }

    /**
     * Clear master key from memory (on logout)
     */
    clearKeys(): void {
        this.masterKey = null;
        console.log('[EncryptionManager] Master key cleared from memory');
    }
}
