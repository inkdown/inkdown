import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { CredentialStorage } from './CredentialStorage';

describe('CredentialStorage', () => {
    // Store original localStorage and sessionStorage
    let originalLocalStorage: Storage;
    let originalSessionStorage: Storage;
    let originalNavigator: Navigator;
    let originalScreen: Screen;

    beforeEach(() => {
        // Save originals
        originalLocalStorage = global.localStorage;
        originalSessionStorage = global.sessionStorage;
        originalNavigator = global.navigator;
        originalScreen = global.screen;

        // Mock navigator for device fingerprinting
        Object.defineProperty(global, 'navigator', {
            value: {
                userAgent: 'Test User Agent',
                language: 'en-US',
            },
            writable: true,
            configurable: true,
        });

        // Mock screen for device fingerprinting
        Object.defineProperty(global, 'screen', {
            value: {
                colorDepth: 24,
                width: 1920,
                height: 1080,
            },
            writable: true,
            configurable: true,
        });

        // Create fresh mocks for each test
        const localStorageMock: Record<string, string> = {};
        const sessionStorageMock: Record<string, string> = {};

        global.localStorage = {
            getItem: (key: string) => localStorageMock[key] || null,
            setItem: (key: string, value: string) => {
                localStorageMock[key] = value;
            },
            removeItem: (key: string) => {
                delete localStorageMock[key];
            },
            clear: () => {
                Object.keys(localStorageMock).forEach(key => delete localStorageMock[key]);
            },
            get length() {
                return Object.keys(localStorageMock).length;
            },
            key: (index: number) => Object.keys(localStorageMock)[index] || null,
        } as Storage;

        global.sessionStorage = {
            getItem: (key: string) => sessionStorageMock[key] || null,
            setItem: (key: string, value: string) => {
                sessionStorageMock[key] = value;
            },
            removeItem: (key: string) => {
                delete sessionStorageMock[key];
            },
            clear: () => {
                Object.keys(sessionStorageMock).forEach(key => delete sessionStorageMock[key]);
            },
            get length() {
                return Object.keys(sessionStorageMock).length;
            },
            key: (index: number) => Object.keys(sessionStorageMock)[index] || null,
        } as Storage;

        // Clear both storages
        localStorage.clear();
        sessionStorage.clear();
        
        // Clear device key cache
        CredentialStorage.clearDeviceKeyCache();
    });

    afterEach(() => {
        // Restore originals
        global.localStorage = originalLocalStorage;
        global.sessionStorage = originalSessionStorage;
        Object.defineProperty(global, 'navigator', {
            value: originalNavigator,
            writable: true,
            configurable: true,
        });
        Object.defineProperty(global, 'screen', {
            value: originalScreen,
            writable: true,
            configurable: true,
        });
    });

    describe('storePassword', () => {
        it('should store password successfully', async () => {
            const password = 'test-password-123';
            
            const result = await CredentialStorage.storePassword(password);
            
            expect(result.success).toBe(true);
            expect(result.data).toBeUndefined();
        });

        it('should store password in encrypted form in localStorage', async () => {
            const password = 'test-password-123';
            
            await CredentialStorage.storePassword(password);
            
            const stored = localStorage.getItem('inkdown_credentials_v2');
            expect(stored).not.toBeNull();
            expect(stored).not.toBe(password); // Should be encrypted
        });

        it('should create salt on first use', async () => {
            await CredentialStorage.storePassword('password');
            
            const salt = localStorage.getItem('inkdown_credential_salt');
            expect(salt).not.toBeNull();
            expect(salt!.length).toBeGreaterThan(0);
        });
    });

    describe('getPassword', () => {
        it('should retrieve stored password successfully', async () => {
            const password = 'test-password-123';
            await CredentialStorage.storePassword(password);
            
            const result = await CredentialStorage.getPassword();
            
            expect(result.success).toBe(true);
            expect(result.data).toBe(password);
        });

        it('should return error when no password stored', async () => {
            const result = await CredentialStorage.getPassword();
            
            expect(result.success).toBe(false);
            expect(result.error).toContain('No password found');
        });

        it('should migrate password from sessionStorage to localStorage', async () => {
            const oldPassword = 'old-session-password';
            sessionStorage.setItem('sync_password', oldPassword);
            
            const result = await CredentialStorage.getPassword();
            
            expect(result.success).toBe(true);
            expect(result.data).toBe(oldPassword);
            
            // Should be migrated
            expect(sessionStorage.getItem('sync_password')).toBeNull();
            expect(localStorage.getItem('inkdown_credentials_v2')).not.toBeNull();
        });

        it('should decrypt password correctly across multiple retrievals', async () => {
            const password = 'my-secure-password-456';
            await CredentialStorage.storePassword(password);
            
            const result1 = await CredentialStorage.getPassword();
            const result2 = await CredentialStorage.getPassword();
            
            expect(result1.success).toBe(true);
            expect(result2.success).toBe(true);
            expect(result1.data).toBe(password);
            expect(result2.data).toBe(password);
        });
    });

    describe('clearPassword', () => {
        it('should clear stored password successfully', async () => {
            await CredentialStorage.storePassword('test-password');
            
            const clearResult = await CredentialStorage.clearPassword();
            
            expect(clearResult.success).toBe(true);
        });

        it('should remove password from localStorage', async () => {
            await CredentialStorage.storePassword('test-password');
            
            await CredentialStorage.clearPassword();
            
            const stored = localStorage.getItem('inkdown_credentials_v2');
            expect(stored).toBeNull();
        });

        it('should also clear old sessionStorage password', async () => {
            sessionStorage.setItem('sync_password', 'old-password');
            
            await CredentialStorage.clearPassword();
            
            expect(sessionStorage.getItem('sync_password')).toBeNull();
        });

        it('should make getPassword fail after clear', async () => {
            await CredentialStorage.storePassword('test-password');
            await CredentialStorage.clearPassword();
            
            const result = await CredentialStorage.getPassword();
            
            expect(result.success).toBe(false);
        });
    });

    describe('hasPassword', () => {
        it('should return false when no password stored', async () => {
            const result = await CredentialStorage.hasPassword();
            
            expect(result).toBe(false);
        });

        it('should return true when password stored in localStorage', async () => {
            await CredentialStorage.storePassword('test-password');
            
            const result = await CredentialStorage.hasPassword();
            
            expect(result).toBe(true);
        });

        it('should return true when password in sessionStorage (old format)', async () => {
            sessionStorage.setItem('sync_password', 'old-password');
            
            const result = await CredentialStorage.hasPassword();
            
            expect(result).toBe(true);
        });

        it('should return false after clearing password', async () => {
            await CredentialStorage.storePassword('test-password');
            await CredentialStorage.clearPassword();
            
            const result = await CredentialStorage.hasPassword();
            
            expect(result).toBe(false);
        });
    });

    describe('encryption security', () => {
        it('should use different encryption for same password on different devices', async () => {
            const password = 'same-password';
            
            // Store once
            await CredentialStorage.storePassword(password);
            const firstEncrypted = localStorage.getItem('inkdown_credentials_v2');
            
            // Clear and simulate different device (clear salt)
            localStorage.clear();
            
            // Store again with new salt
            await CredentialStorage.storePassword(password);
            const secondEncrypted = localStorage.getItem('inkdown_credentials_v2');
            
            // Encrypted values should be different (different salts)
            expect(firstEncrypted).not.toBe(secondEncrypted);
        });

        it('should use same encryption on same device for consistency', async () => {
            const password = 'test-password';
            
            // Store once
            await CredentialStorage.storePassword(password);
            const firstEncrypted = localStorage.getItem('inkdown_credentials_v2');
            const salt = localStorage.getItem('inkdown_credential_salt');
            
            // Clear credentials but keep salt
            localStorage.removeItem('inkdown_credentials_v2');
            // Clear device key cache to force re-generation
            CredentialStorage.clearDeviceKeyCache();
            
            // Store again with same salt (should use same device key)
            await CredentialStorage.storePassword(password);
            const secondEncrypted = localStorage.getItem('inkdown_credentials_v2');
            
            // Both should use same salt
            expect(localStorage.getItem('inkdown_credential_salt')).toBe(salt);
            
            // When decrypted, both should give same password
            localStorage.setItem('inkdown_credentials_v2', firstEncrypted!);
            CredentialStorage.clearDeviceKeyCache();
            const result1 = await CredentialStorage.getPassword();
            
            localStorage.setItem('inkdown_credentials_v2', secondEncrypted!);
            CredentialStorage.clearDeviceKeyCache();
            const result2 = await CredentialStorage.getPassword();
            
            expect(result1.success).toBe(true);
            expect(result2.success).toBe(true);
            expect(result1.data).toBe(password);
            expect(result2.data).toBe(password);
        });
    });
});
