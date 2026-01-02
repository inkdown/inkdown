/**
 * AppError Hierarchy Tests
 * 
 * Tests for custom error types following TDD
 */

import { describe, it, expect } from 'vitest';
import {
    AppError,
    FileSystemError,
    ConfigError,
    ValidationError,
    NetworkError,
    isAppError,
    toAppError,
} from '@inkdown/core';

describe('AppError', () => {
    describe('base AppError class', () => {
        it('should extend Error', () => {
            const error = new AppError('test message');
            
            expect(error).toBeInstanceOf(Error);
            expect(error.message).toBe('test message');
            expect(error.name).toBe('AppError');
        });

        it('should include error code', () => {
            const error = new AppError('test', 'TEST_ERROR');
            
            expect(error.code).toBe('TEST_ERROR');
        });

        it('should preserve stack trace', () => {
            const error = new AppError('test');
            
            expect(error.stack).toBeDefined();
            expect(error.stack).toContain('AppError');
        });

        it('should allow optional metadata', () => {
            const error = new AppError('test', 'TEST', { userId: 123 });
            
            expect(error.metadata).toEqual({ userId: 123 });
        });
    });

    describe('FileSystemError', () => {
        it('should extend AppError', () => {
            const error = new FileSystemError('File not found', '/path/to/file');
            
            expect(error).toBeInstanceOf(Error);
            expect(error.name).toBe('FileSystemError');
            expect(error.message).toBe('File not found');
            expect(error.path).toBe('/path/to/file');
        });

        it('should have default code', () => {
            const error = new FileSystemError('test', '/path');
            
            expect(error.code).toBe('FILESYSTEM_ERROR');
        });

        it('should allow custom code', () => {
            const error = new FileSystemError('test', '/path', 'FILE_NOT_FOUND');
            
            expect(error.code).toBe('FILE_NOT_FOUND');
        });
    });

    describe('ConfigError', () => {
        it('should extend AppError', () => {
            const error = new ConfigError('Invalid config', 'app.json');
            
            expect(error).toBeInstanceOf(Error);
            expect(error.name).toBe('ConfigError');
            expect(error.configKey).toBe('app.json');
        });

        it('should have default code', () => {
            const error = new ConfigError('test', 'key');
            
            expect(error.code).toBe('CONFIG_ERROR');
        });
    });

    describe('ValidationError', () => {
        it('should extend AppError', () => {
            const error = new ValidationError('Invalid email', 'email', 'test@');
            
            expect(error).toBeInstanceOf(Error);
            expect(error.name).toBe('ValidationError');
            expect(error.field).toBe('email');
            expect(error.value).toBe('test@');
        });

        it('should have default code', () => {
            const error = new ValidationError('test', 'field', 'value');
            
            expect(error.code).toBe('VALIDATION_ERROR');
        });
    });

    describe('NetworkError', () => {
        it('should extend AppError', () => {
            const error = new NetworkError('Connection failed', 'https://api.example.com');
            
            expect(error).toBeInstanceOf(Error);
            expect(error.name).toBe('NetworkError');
            expect(error.url).toBe('https://api.example.com');
        });

        it('should include status code if provided', () => {
            const error = new NetworkError('Not found', 'https://api.example.com', 404);
            
            expect(error.statusCode).toBe(404);
        });
    });
});

describe('Error utilities', () => {
    describe('isAppError', () => {
        it('should return true for AppError instances', () => {
            const error = new AppError('test');
            
            expect(isAppError(error)).toBe(true);
        });

        it('should return false for regular errors', () => {
            const error = new Error('test');
            
            expect(isAppError(error)).toBe(false);
        });

        it('should return false for non-errors', () => {
            expect(isAppError('string')).toBe(false);
            expect(isAppError(null)).toBe(false);
            expect(isAppError(undefined)).toBe(false);
        });
    });

    describe('toAppError', () => {
        it('should pass through AppError instances', () => {
            const error = new AppError('test', 'TEST');
            
            const result = toAppError(error);
            
            expect(result).toBe(error);
        });

        it('should convert Error to AppError', () => {
            const error = new Error('test');
            
            const result = toAppError(error);
            
            expect(result.message).toBe('test');
            expect(result.code).toBe('UNKNOWN_ERROR');
        });

        it('should convert string to AppError', () => {
            const result = toAppError('something went wrong');
            
            expect(result.message).toBe('something went wrong');
            expect(result.code).toBe('UNKNOWN_ERROR');
        });

        it('should convert unknown values to AppError', () => {
            const result = toAppError({ weird: 'object' });
            
            expect(result.message).toContain('object');
            expect(result.code).toBe('UNKNOWN_ERROR');
        });
    });
});
