import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { EncryptionManager } from '../../../packages/core/src/sync/EncryptionManager';

// Mock localStorage
const localStorageMock = (() => {
	let store: Record<string, string> = {};
	return {
		getItem: (key: string) => store[key] || null,
		setItem: (key: string, value: string) => {
			store[key] = value;
		},
		removeItem: (key: string) => {
			delete store[key];
		},
		clear: () => {
			store = {};
		},
	};
})();

global.localStorage = localStorageMock as any;

describe('EncryptionManager - Key Persistence', () => {
	let encryptionManager: EncryptionManager;
	const TEST_PASSWORD = 'test-password-123';
	const BASE_URL = 'http://localhost:8080/api/v1';

	// Mock fetch globally
	const mockFetch = vi.fn();
	global.fetch = mockFetch as any;

	beforeEach(() => {
		localStorage.clear();
		encryptionManager = new EncryptionManager(BASE_URL);
		
		// Mock TokenRefreshService
		const mockTokenRefresh = {
			withAuth: async (callback: (token: string) => Promise<any>) => {
				return callback('mock-access-token');
			},
		};
		(encryptionManager as any).tokenRefresh = mockTokenRefresh;
		
		mockFetch.mockClear();
	});

	afterEach(() => {
		localStorage.clear();
	});

	describe('Password-based key restoration', () => {
		it('should restore encryption key from password after restart', async () => {
			// Mock successful server responses
			mockFetch.mockResolvedValueOnce({
				ok: true,
				json: async () => ({}),
			});

			// Setup encryption with password
			await encryptionManager.setupEncryption(TEST_PASSWORD);

			// Verify key is initialized
			expect(encryptionManager.isInitialized()).toBe(true);

			// Save to storage
			await encryptionManager.saveToStorage();

			// Clear in-memory key (simulate app restart)
			encryptionManager.clearKeys();
			expect(encryptionManager.isInitialized()).toBe(false);

			// Try to restore with password (no token needed)
			const restored = await encryptionManager.restoreFromPassword(TEST_PASSWORD);

			// Should succeed
			expect(restored).toBe(true);
			expect(encryptionManager.isInitialized()).toBe(true);
		});

		it('should fail to restore with wrong password', async () => {
			// Mock successful server responses
			mockFetch.mockResolvedValueOnce({
				ok: true,
				json: async () => ({}),
			});

			// Setup encryption
			await encryptionManager.setupEncryption(TEST_PASSWORD);
			await encryptionManager.saveToStorage();

			// Clear in-memory key
			encryptionManager.clearKeys();

			// Try to restore with WRONG password
			const restored = await encryptionManager.restoreFromPassword('wrong-password');

			// Should fail
			expect(restored).toBe(false);
			expect(encryptionManager.isInitialized()).toBe(false);
		});

		it('should return false when no encryption params stored', async () => {
			// Try to restore without any stored data
			const restored = await encryptionManager.restoreFromPassword(TEST_PASSWORD);

			expect(restored).toBe(false);
			expect(encryptionManager.isInitialized()).toBe(false);
		});
	});

	describe('Encryption/Decryption after restoration', () => {
		it('should encrypt and decrypt after password restoration', async () => {
			// Mock successful server responses
			mockFetch.mockResolvedValueOnce({
				ok: true,
				json: async () => ({}),
			});

			// Setup encryption
			await encryptionManager.setupEncryption(TEST_PASSWORD);
			await encryptionManager.saveToStorage();

			// Encrypt some data
			const originalData = { title: 'Test Note', content: 'Secret content' };
			const encrypted = await encryptionManager.encryptNote(
				originalData.title,
				originalData.content,
			);

			// Clear and restore
			encryptionManager.clearKeys();
			await encryptionManager.restoreFromPassword(TEST_PASSWORD);

			// Decrypt the data
			const decrypted = await encryptionManager.decryptNote(encrypted);

			// Should match original
			expect(decrypted.title).toBe(originalData.title);
			expect(decrypted.content).toBe(originalData.content);
		});
	});
});
