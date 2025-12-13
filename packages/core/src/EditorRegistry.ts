import type { EditorView } from '@codemirror/view';

/**
 * EditorRegistry - Manages editor instances
 * Allows plugins to access the active editor
 */
export class EditorRegistry {
    private editors: Map<string, EditorView> = new Map();
    private activeEditorId: string | null = null;

    /**
     * Register an editor instance
     */
    register(id: string, view: EditorView): void {
        this.editors.set(id, view);
        console.log(`Editor registered: ${id}`);
    }

    /**
     * Unregister an editor instance
     */
    unregister(id: string): void {
        this.editors.delete(id);
        if (this.activeEditorId === id) {
            this.activeEditorId = null;
        }
        console.log(`Editor unregistered: ${id}`);
    }

    /**
     * Set the active editor
     */
    setActive(id: string | null): void {
        if (id === null || this.editors.has(id)) {
            this.activeEditorId = id;
        }
    }

    /**
     * Get the active editor view
     */
    getActive(): EditorView | null {
        if (this.activeEditorId && this.editors.has(this.activeEditorId)) {
            return this.editors.get(this.activeEditorId)!;
        }
        // Fallback to any editor if no active set
        if (this.editors.size > 0) {
            const firstEditor = this.editors.values().next().value;
            return firstEditor ?? null;
        }
        return null;
    }

    /**
     * Get editor by ID
     */
    get(id: string): EditorView | null {
        return this.editors.get(id) || null;
    }

    /**
     * Check if an editor is registered
     */
    has(id: string): boolean {
        return this.editors.has(id);
    }

    /**
     * Get all registered editor IDs
     */
    getAll(): string[] {
        return Array.from(this.editors.keys());
    }
}
