/**
 * EditorRegistry Unit Tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { EditorRegistry } from '@inkdown/core/EditorRegistry';

// Mock EditorView
const createMockEditorView = (id: string) => ({
    id,
    state: { doc: { toString: () => `content-${id}` } },
    dispatch: vi.fn(),
    focus: vi.fn(),
});

describe('EditorRegistry', () => {
    let registry: EditorRegistry;

    beforeEach(() => {
        registry = new EditorRegistry();
    });

    describe('register', () => {
        it('should register an editor', () => {
            const view = createMockEditorView('editor-1');

            registry.register('editor-1', view as any);

            expect(registry.has('editor-1')).toBe(true);
        });

        it('should allow registering multiple editors', () => {
            const view1 = createMockEditorView('editor-1');
            const view2 = createMockEditorView('editor-2');

            registry.register('editor-1', view1 as any);
            registry.register('editor-2', view2 as any);

            expect(registry.has('editor-1')).toBe(true);
            expect(registry.has('editor-2')).toBe(true);
        });
    });

    describe('unregister', () => {
        it('should unregister an editor', () => {
            const view = createMockEditorView('editor-1');
            registry.register('editor-1', view as any);

            registry.unregister('editor-1');

            expect(registry.has('editor-1')).toBe(false);
        });

        it('should clear active editor if it was unregistered', () => {
            const view = createMockEditorView('editor-1');
            registry.register('editor-1', view as any);
            registry.setActive('editor-1');

            registry.unregister('editor-1');

            expect(registry.getActive()).toBeNull();
        });

        it('should handle unregistering non-existent editor gracefully', () => {
            expect(() => registry.unregister('nonexistent')).not.toThrow();
        });
    });

    describe('setActive', () => {
        it('should set the active editor', () => {
            const view = createMockEditorView('editor-1');
            registry.register('editor-1', view as any);

            registry.setActive('editor-1');

            expect(registry.getActive()).toBe(view);
        });

        it('should not set active if editor is not registered', () => {
            const view = createMockEditorView('editor-1');
            registry.register('editor-1', view as any);
            registry.setActive('editor-1');

            registry.setActive('nonexistent');

            // Should keep previous active
            expect(registry.getActive()).toBe(view);
        });

        it('should allow setting active to null', () => {
            const view = createMockEditorView('editor-1');
            registry.register('editor-1', view as any);
            registry.setActive('editor-1');

            registry.setActive(null);

            // getActive falls back to first registered editor
            expect(registry.getActive()).toBe(view);
        });
    });

    describe('getActive', () => {
        it('should return the active editor', () => {
            const view1 = createMockEditorView('editor-1');
            const view2 = createMockEditorView('editor-2');
            registry.register('editor-1', view1 as any);
            registry.register('editor-2', view2 as any);
            registry.setActive('editor-2');

            expect(registry.getActive()).toBe(view2);
        });

        it('should fallback to first editor if no active is set', () => {
            const view = createMockEditorView('editor-1');
            registry.register('editor-1', view as any);

            expect(registry.getActive()).toBe(view);
        });

        it('should return null if no editors are registered', () => {
            expect(registry.getActive()).toBeNull();
        });
    });

    describe('get', () => {
        it('should return editor by ID', () => {
            const view = createMockEditorView('editor-1');
            registry.register('editor-1', view as any);

            expect(registry.get('editor-1')).toBe(view);
        });

        it('should return null for non-existent ID', () => {
            expect(registry.get('nonexistent')).toBeNull();
        });
    });

    describe('has', () => {
        it('should return true if editor is registered', () => {
            const view = createMockEditorView('editor-1');
            registry.register('editor-1', view as any);

            expect(registry.has('editor-1')).toBe(true);
        });

        it('should return false if editor is not registered', () => {
            expect(registry.has('nonexistent')).toBe(false);
        });
    });

    describe('getAll', () => {
        it('should return all registered editor IDs', () => {
            const view1 = createMockEditorView('editor-1');
            const view2 = createMockEditorView('editor-2');
            const view3 = createMockEditorView('editor-3');
            registry.register('editor-1', view1 as any);
            registry.register('editor-2', view2 as any);
            registry.register('editor-3', view3 as any);

            const ids = registry.getAll();

            expect(ids).toContain('editor-1');
            expect(ids).toContain('editor-2');
            expect(ids).toContain('editor-3');
            expect(ids).toHaveLength(3);
        });

        it('should return empty array when no editors are registered', () => {
            expect(registry.getAll()).toEqual([]);
        });
    });
});
