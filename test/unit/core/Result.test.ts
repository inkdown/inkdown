/**
 * Result Type Tests
 * 
 * Tests for Result<T, E> type following TDD
 * Result type for functional error handling (inspired by Rust)
 */

import { describe, it, expect } from 'vitest';
import {
    type Result,
    Ok,
    Err,
    fromPromise,
    tryCatch,
} from '@inkdown/core';

describe('Result<T, E>', () => {
    describe('Ok variant', () => {
        it('should create success result', () => {
            const result = Ok(42);
            
            expect(result.isOk()).toBe(true);
            expect(result.isErr()).toBe(false);
        });

        it('should unwrap to value', () => {
            const result = Ok('success');
            
            expect(result.unwrap()).toBe('success');
        });

        it('should map value', () => {
            const result = Ok(10);
            const mapped = result.map(x => x * 2);
            
            expect(mapped.unwrap()).toBe(20);
        });

        it('should not map error', () => {
            const result = Ok(10);
            const mapped = result.mapErr(e => `Error: ${e}`);
            
            expect(mapped.unwrap()).toBe(10);
        });

        it('should return value with unwrapOr', () => {
            const result = Ok(42);
            
            expect(result.unwrapOr(0)).toBe(42);
        });

        it('should match with success callback', () => {
            const result = Ok(42);
            const value = result.match(
                (val) => val * 2,
                (_err) => 0
            );
            
            expect(value).toBe(84);
        });
    });

    describe('Err variant', () => {
        it('should create error result', () => {
            const result = Err('failed');
            
            expect(result.isOk()).toBe(false);
            expect(result.isErr()).toBe(true);
        });

        it('should throw on unwrap', () => {
            const result = Err('failed');
            
            expect(() => result.unwrap()).toThrow('failed');
        });

        it('should not map value', () => {
            const result: Result<number, string> = Err('error');
            const mapped = result.map(x => x * 2);
            
            expect(mapped.isErr()).toBe(true);
        });

        it('should map error', () => {
            const result = Err('error');
            const mapped = result.mapErr(e => `Failed: ${e}`);
            
            expect(() => mapped.unwrap()).toThrow('Failed: error');
        });

        it('should return default with unwrapOr', () => {
            const result: Result<number, string> = Err('error');
            
            expect(result.unwrapOr(0)).toBe(0);
        });

        it('should match with error callback', () => {
            const result = Err('failed');
            const value = result.match(
                (val) => val,
                (err) => `Error: ${err}`
            );
            
            expect(value).toBe('Error: failed');
        });
    });

    describe('andThen (flatMap)', () => {
        it('should chain successful operations', () => {
            const result = Ok(10)
                .andThen(x => Ok(x * 2))
                .andThen(x => Ok(x + 5));
            
            expect(result.unwrap()).toBe(25);
        });

        it('should short-circuit on error', () => {
            const result: Result<number, string> = Ok(10)
                .andThen(_x => Err('failed'))
                .andThen(x => Ok(x * 2));
            
            expect(result.isErr()).toBe(true);
            expect(() => result.unwrap()).toThrow('failed');
        });
    });

    describe('orElse', () => {
        it('should not execute on Ok', () => {
            const result = Ok(42)
                .orElse(() => Ok(0));
            
            expect(result.unwrap()).toBe(42);
        });

        it('should execute on Err', () => {
            const result: Result<number, string> = Err('first error')
                .orElse(() => Ok(42));
            
            expect(result.unwrap()).toBe(42);
        });

        it('should chain errors', () => {
            const result: Result<number, string> = Err('first')
                .orElse(() => Err('second'));
            
            expect(() => result.unwrap()).toThrow('second');
        });
    });

    describe('utility methods', () => {
        it('should convert Ok to option-like behavior', () => {
            const result = Ok(42);
            
            expect(result.ok()).toBe(42);
            expect(result.err()).toBeUndefined();
        });

        it('should convert Err to option-like behavior', () => {
            const result: Result<number, string> = Err('failed');
            
            expect(result.ok()).toBeUndefined();
            expect(result.err()).toBe('failed');
        });

        it('should unwrapOrElse with function', () => {
            const result: Result<number, string> = Err('error');
            const value = result.unwrapOrElse((err) => err.length);
            
            expect(value).toBe(5); // 'error'.length
        });

        it('should expect with custom message', () => {
            const result: Result<number, string> = Err('failed');
            
            expect(() => result.expect('Custom error')).toThrow('Custom error: failed');
        });
    });

    describe('type inference', () => {
        it('should infer types correctly', () => {
            const result: Result<number, string> = Ok(42);
            
            // TypeScript should know this is number
            const value = result.match(
                (val) => val + 10,
                (_err) => 0
            );
            
            expect(value).toBe(52);
        });

        it('should work with complex types', () => {
            type User = { id: number; name: string };
            
            const result: Result<User, Error> = Ok({ id: 1, name: 'Alice' });
            
            const name = result.map(user => user.name).unwrap();
            expect(name).toBe('Alice');
        });
    });

    describe('helper functions', () => {
        it('should provide fromPromise helper', async () => {
            const successPromise = Promise.resolve(42);
            const result = await fromPromise(successPromise);
            
            expect(result.unwrap()).toBe(42);
        });

        it('should handle rejected promises', async () => {
            const failedPromise = Promise.reject(new Error('failed'));
            const result = await fromPromise(failedPromise);
            
            expect(result.isErr()).toBe(true);
        });

        it('should provide tryCatch helper', () => {
            const result = tryCatch(() => {
                return 42;
            });
            
            expect(result.unwrap()).toBe(42);
        });

        it('should catch exceptions in tryCatch', () => {
            const result = tryCatch(() => {
                throw new Error('boom');
            });
            
            expect(result.isErr()).toBe(true);
        });
    });
});
