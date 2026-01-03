import { type Result, Ok, Err } from '../errors/Result';
import { loggers } from '../utils/logger';

const logger = loggers.sync;

/**
 * Service responsible for encrypting and decrypting data using AES-GCM
 * with PBKDF2 key derivation.
 */
export class EncryptionService {
	private readonly ALGORITHM = 'AES-GCM';
	private readonly KEY_LENGTH = 256;
	private readonly ITERATIONS = 100000;
	private readonly IV_LENGTH = 12;
	private readonly SALT_LENGTH = 16;

	/**
	 * Derives an encryption key from a password using PBKDF2.
	 */
	async deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
		const encoder = new TextEncoder();
		const keyMaterial = await crypto.subtle.importKey(
			'raw',
			encoder.encode(password),
			'PBKDF2',
			false,
			['deriveBits', 'deriveKey']
		);

		return crypto.subtle.deriveKey(
			{
				name: 'PBKDF2',
				salt,
				iterations: this.ITERATIONS,
				hash: 'SHA-256'
			},
			keyMaterial,
			{ name: this.ALGORITHM, length: this.KEY_LENGTH },
			true, // extractable for testing
			['encrypt', 'decrypt']
		);
	}

	/**
	 * Encrypts data with a password.
	 * Returns base64-encoded string containing salt, IV, and ciphertext.
	 */
	async encrypt<T>(data: T, password: string): Promise<string> {
		try {
			const salt = crypto.getRandomValues(new Uint8Array(this.SALT_LENGTH));
			const iv = crypto.getRandomValues(new Uint8Array(this.IV_LENGTH));
			const key = await this.deriveKey(password, salt);

			const encoder = new TextEncoder();
			const dataBytes = encoder.encode(JSON.stringify(data));

			const ciphertext = await crypto.subtle.encrypt(
				{ name: this.ALGORITHM, iv },
				key,
				dataBytes
			);

			// Combine salt + IV + ciphertext
			const combined = new Uint8Array(
				salt.length + iv.length + ciphertext.byteLength
			);
			combined.set(salt, 0);
			combined.set(iv, salt.length);
			combined.set(new Uint8Array(ciphertext), salt.length + iv.length);

			// Return as base64
			return btoa(String.fromCharCode(...combined));
		} catch (error) {
			logger.error({ error, module: 'EncryptionService' }, 'Encryption failed');
			throw new Error('Encryption failed');
		}
	}

	/**
	 * Decrypts data with a password.
	 * Expects base64-encoded string containing salt, IV, and ciphertext.
	 */
	async decrypt<T>(encryptedData: string, password: string): Promise<T> {
		try {
			// Decode from base64
			const combined = Uint8Array.from(atob(encryptedData), c => c.charCodeAt(0));

			// Extract salt, IV, and ciphertext
			const salt = combined.slice(0, this.SALT_LENGTH);
			const iv = combined.slice(this.SALT_LENGTH, this.SALT_LENGTH + this.IV_LENGTH);
			const ciphertext = combined.slice(this.SALT_LENGTH + this.IV_LENGTH);

			const key = await this.deriveKey(password, salt);

			const decrypted = await crypto.subtle.decrypt(
				{ name: this.ALGORITHM, iv },
				key,
				ciphertext
			);

			const decoder = new TextDecoder();
			const jsonString = decoder.decode(decrypted);
			return JSON.parse(jsonString) as T;
		} catch (error) {
			logger.error({ error, module: 'EncryptionService' }, 'Decryption failed');
			throw new Error('Decryption failed: invalid password or corrupted data');
		}
	}

	/**
	 * Encrypts data and returns a Result type for better error handling.
	 */
	async encryptSafe<T>(data: T, password: string): Promise<Result<string, Error>> {
		try {
			const encrypted = await this.encrypt(data, password);
			return Ok(encrypted);
		} catch (error) {
			return Err(error instanceof Error ? error : new Error('Encryption failed'));
		}
	}

	/**
	 * Decrypts data and returns a Result type for better error handling.
	 */
	async decryptSafe<T>(encryptedData: string, password: string): Promise<Result<T, Error>> {
		try {
			const decrypted = await this.decrypt<T>(encryptedData, password);
			return Ok(decrypted);
		} catch (error) {
			return Err(error instanceof Error ? error : new Error('Decryption failed'));
		}
	}
}
