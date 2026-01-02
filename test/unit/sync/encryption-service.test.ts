import { describe, it, expect, beforeEach } from 'vitest';
import { EncryptionService } from '../../../packages/core/src/sync/EncryptionService';

describe('EncryptionService', () => {
	let service: EncryptionService;

	beforeEach(() => {
		service = new EncryptionService();
	});

	describe('encryption and decryption', () => {
		it('should encrypt and decrypt data successfully', async () => {
			const password = 'test-password-123';
			const data = { message: 'secret data', timestamp: Date.now() };

			const encrypted = await service.encrypt(data, password);
			expect(encrypted).toBeTruthy();
			expect(encrypted).not.toEqual(JSON.stringify(data));

			const decrypted = await service.decrypt(encrypted, password);
			expect(decrypted).toEqual(data);
		});

		it('should fail to decrypt with wrong password', async () => {
			const password = 'correct-password';
			const wrongPassword = 'wrong-password';
			const data = { message: 'secret' };

			const encrypted = await service.encrypt(data, password);
			
			await expect(
				service.decrypt(encrypted, wrongPassword)
			).rejects.toThrow();
		});

		it('should handle large data', async () => {
			const password = 'test-password';
			const largeData = {
				notes: Array(100).fill(null).map((_, i) => ({
					id: `note-${i}`,
					content: `${'x'.repeat(1000)}`,
					timestamp: Date.now()
				}))
			};

			const encrypted = await service.encrypt(largeData, password);
			const decrypted = await service.decrypt(encrypted, password);
			
			expect(decrypted).toEqual(largeData);
		});

		it('should produce different ciphertext for same data', async () => {
			const password = 'test-password';
			const data = { message: 'same message' };

			const encrypted1 = await service.encrypt(data, password);
			const encrypted2 = await service.encrypt(data, password);

			expect(encrypted1).not.toEqual(encrypted2);

			const decrypted1 = await service.decrypt(encrypted1, password);
			const decrypted2 = await service.decrypt(encrypted2, password);

			expect(decrypted1).toEqual(data);
			expect(decrypted2).toEqual(data);
		});
	});

	describe('key derivation', () => {
		it('should derive same key for same password and salt', async () => {
			const password = 'test-password';
			const salt = crypto.getRandomValues(new Uint8Array(16));

			const key1 = await service.deriveKey(password, salt);
			const key2 = await service.deriveKey(password, salt);

			const exported1 = await crypto.subtle.exportKey('raw', key1);
			const exported2 = await crypto.subtle.exportKey('raw', key2);

			expect(new Uint8Array(exported1)).toEqual(new Uint8Array(exported2));
		});

		it('should derive different keys for different salts', async () => {
			const password = 'test-password';
			const salt1 = crypto.getRandomValues(new Uint8Array(16));
			const salt2 = crypto.getRandomValues(new Uint8Array(16));

			const key1 = await service.deriveKey(password, salt1);
			const key2 = await service.deriveKey(password, salt2);

			const exported1 = await crypto.subtle.exportKey('raw', key1);
			const exported2 = await crypto.subtle.exportKey('raw', key2);

			expect(new Uint8Array(exported1)).not.toEqual(new Uint8Array(exported2));
		});
	});

	describe('error handling', () => {
		it('should throw on invalid encrypted data format', async () => {
			const password = 'test-password';
			const invalidData = 'not-valid-encrypted-data';

			await expect(
				service.decrypt(invalidData, password)
			).rejects.toThrow();
		});

		it('should handle empty data', async () => {
			const password = 'test-password';
			const data = {};

			const encrypted = await service.encrypt(data, password);
			const decrypted = await service.decrypt(encrypted, password);

			expect(decrypted).toEqual(data);
		});
	});
});
