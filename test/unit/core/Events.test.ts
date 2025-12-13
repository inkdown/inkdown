/**
 * Events Unit Tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Events } from '@inkdown/core/Events';

// Create a testable subclass that exposes trigger
class TestableEvents extends Events {
    public emit(name: string, ...args: unknown[]): void {
        this.trigger(name, ...args);
    }
}

describe('Events', () => {
    let events: TestableEvents;

    beforeEach(() => {
        events = new TestableEvents();
    });

    describe('on', () => {
        it('should register an event handler', () => {
            const handler = vi.fn();
            events.on('test', handler);

            events.emit('test');

            expect(handler).toHaveBeenCalledTimes(1);
        });

        it('should pass arguments to the handler', () => {
            const handler = vi.fn();
            events.on('test', handler);

            events.emit('test', 'arg1', 'arg2', 123);

            expect(handler).toHaveBeenCalledWith('arg1', 'arg2', 123);
        });

        it('should allow multiple handlers for the same event', () => {
            const handler1 = vi.fn();
            const handler2 = vi.fn();

            events.on('test', handler1);
            events.on('test', handler2);

            events.emit('test');

            expect(handler1).toHaveBeenCalledTimes(1);
            expect(handler2).toHaveBeenCalledTimes(1);
        });

        it('should return an EventRef for unloading', () => {
            const handler = vi.fn();
            const ref = events.on('test', handler);

            expect(ref).toHaveProperty('unload');
            expect(typeof ref.unload).toBe('function');
        });
    });

    describe('off', () => {
        it('should unregister a specific handler', () => {
            const handler = vi.fn();
            events.on('test', handler);

            events.off('test', handler);
            events.emit('test');

            expect(handler).not.toHaveBeenCalled();
        });

        it('should keep other handlers when removing one', () => {
            const handler1 = vi.fn();
            const handler2 = vi.fn();

            events.on('test', handler1);
            events.on('test', handler2);

            events.off('test', handler1);
            events.emit('test');

            expect(handler1).not.toHaveBeenCalled();
            expect(handler2).toHaveBeenCalledTimes(1);
        });

        it('should handle removing non-existent handler gracefully', () => {
            const handler = vi.fn();

            // Should not throw
            expect(() => events.off('test', handler)).not.toThrow();
        });
    });

    describe('offAll', () => {
        it('should remove all handlers for a specific event', () => {
            const handler1 = vi.fn();
            const handler2 = vi.fn();

            events.on('test', handler1);
            events.on('test', handler2);

            events.offAll('test');
            events.emit('test');

            expect(handler1).not.toHaveBeenCalled();
            expect(handler2).not.toHaveBeenCalled();
        });

        it('should remove all handlers for all events when called without arguments', () => {
            const handler1 = vi.fn();
            const handler2 = vi.fn();

            events.on('event1', handler1);
            events.on('event2', handler2);

            events.offAll();
            events.emit('event1');
            events.emit('event2');

            expect(handler1).not.toHaveBeenCalled();
            expect(handler2).not.toHaveBeenCalled();
        });
    });

    describe('EventRef.unload', () => {
        it('should unregister the handler when called', () => {
            const handler = vi.fn();
            const ref = events.on('test', handler);

            ref.unload();
            events.emit('test');

            expect(handler).not.toHaveBeenCalled();
        });
    });

    describe('trigger (protected)', () => {
        it('should not throw when no handlers are registered', () => {
            expect(() => events.emit('nonexistent')).not.toThrow();
        });

        it('should continue calling handlers even if one throws', () => {
            const errorHandler = vi.fn().mockImplementation(() => {
                throw new Error('Handler error');
            });
            const normalHandler = vi.fn();
            const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

            events.on('test', errorHandler);
            events.on('test', normalHandler);

            events.emit('test');

            expect(errorHandler).toHaveBeenCalled();
            expect(normalHandler).toHaveBeenCalled();
            expect(consoleError).toHaveBeenCalled();

            consoleError.mockRestore();
        });
    });
});
