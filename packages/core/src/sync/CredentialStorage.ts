import { loggers } from '../utils/logger';
import type { Result } from '../types/Result';

const logger = loggers.sync;

/**
 * Secure credential storage using encrypted localStorage
 * Encrypts password with device-specific key before storing
 */
export class CredentialStorage {
    private static readonly STORAGE_KEY = 'inkdown_credentials_v2';
    private static readonly SALT_KEY = 'inkdown_credential_salt';
    private static readonly OLD_SESSION_KEY = 'sync_password';
    private static deviceKey: CryptoKey | null = null;

    /**
     * Clear device key cache (useful for testing)
     */
    static clearDeviceKeyCache(): void {
        CredentialStorage.deviceKey = null;
    }

    /**
     * Generate device-specific encryption key
     * Uses combination of navigator properties as fingerprint
     */
    private static async getDeviceKey(): Promise<CryptoKey> {
        if (CredentialStorage.deviceKey) return CredentialStorage.deviceKey;

        // Get or create salt
        const saltB64 = localStorage.getItem(CredentialStorage.SALT_KEY);
        let salt: Uint8Array;

        if (saltB64) {
            salt = CredentialStorage.base64ToArrayBuffer(saltB64);
        } else {
            salt = crypto.getRandomValues(new Uint8Array(16));
            localStorage.setItem(CredentialStorage.SALT_KEY, CredentialStorage.arrayBufferToBase64(salt));
        }

        // Create device fingerprint (not perfect but reasonable for browser)
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
            ['deriveBits', 'deriveKey'],
        );

        CredentialStorage.deviceKey = await crypto.subtle.deriveKey(
            {
                name: 'PBKDF2',
                salt: salt,
                iterations: 100000,
                hash: 'SHA-256',
            },
            fingerprintKey,
            { name: 'AES-GCM', length: 256 },
            false,
            ['encrypt', 'decrypt'],
        );

        return CredentialStorage.deviceKey;
    }

    /**
     * Convert ArrayBuffer to base64 string
     */
    private static arrayBufferToBase64(buffer: ArrayBuffer | Uint8Array): string {
        const bytes = new Uint8Array(buffer);
        let binary = '';
        for (const byte of bytes) {
            binary += String.fromCharCode(byte);
        }
        return btoa(binary);
    }

    /**
     * Convert base64 string to Uint8Array
     */
    private static base64ToArrayBuffer(base64: string): Uint8Array {
        const binary = atob(base64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
            bytes[i] = binary.charCodeAt(i);
        }
        return bytes;
    }

    /**
     * Store password encrypted with device key
     */
    static async storePassword(password: string): Promise<Result<void>> {
        try {
            logger.debug('Storing password securely');

            const deviceKey = await CredentialStorage.getDeviceKey();
            const encoder = new TextEncoder();
            const passwordData = encoder.encode(password);
            const nonce = crypto.getRandomValues(new Uint8Array(12));

            const encrypted = await crypto.subtle.encrypt(
                { name: 'AES-GCM', iv: nonce },
                deviceKey,
                passwordData,
            );

            // Combine nonce + encrypted data
            const combined = new Uint8Array(nonce.length + encrypted.byteLength);
            combined.set(nonce, 0);
            combined.set(new Uint8Array(encrypted), nonce.length);

            const blob = CredentialStorage.arrayBufferToBase64(combined);
            localStorage.setItem(CredentialStorage.STORAGE_KEY, blob);

            logger.info('Password stored successfully');
            return { success: true, data: undefined };
        } catch (error) {
            logger.error('Failed to store password', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error storing password',
            };
        }
    }

    /**
     * Retrieve and decrypt password
     */
    static async getPassword(): Promise<Result<string>> {
        try {
            const blob = localStorage.getItem(CredentialStorage.STORAGE_KEY);

            if (!blob) {
                // Check for migration from sessionStorage
                const oldPassword = sessionStorage.getItem(CredentialStorage.OLD_SESSION_KEY);
                if (oldPassword) {
                    logger.info('Migrating password from sessionStorage');
                    await CredentialStorage.storePassword(oldPassword);
                    sessionStorage.removeItem(CredentialStorage.OLD_SESSION_KEY);
                    return { success: true, data: oldPassword };
                }

                logger.debug('No password found in storage');
                return {
                    success: false,
                    error: 'No password found. Please set up sync.',
                };
            }

            const deviceKey = await CredentialStorage.getDeviceKey();
            const combined = CredentialStorage.base64ToArrayBuffer(blob);

            const nonce = combined.slice(0, 12);
            const encrypted = combined.slice(12);

            const decrypted = await crypto.subtle.decrypt(
                { name: 'AES-GCM', iv: nonce },
                deviceKey,
                encrypted,
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
            localStorage.removeItem(CredentialStorage.STORAGE_KEY);
            sessionStorage.removeItem(CredentialStorage.OLD_SESSION_KEY); // Also clear old format
            logger.info('Password cleared successfully');
            return { success: true, data: undefined };
        } catch (error) {
            logger.error('Failed to clear password', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error clearing password',
            };
        }
    }

    /**
     * Check if password is stored
     */
    static async hasPassword(): Promise<boolean> {
        try {
            const hasNew = localStorage.getItem(CredentialStorage.STORAGE_KEY) !== null;
            const hasOld = sessionStorage.getItem(CredentialStorage.OLD_SESSION_KEY) !== null;
            return hasNew || hasOld;
        } catch {
            return false;
        }
    }
}
