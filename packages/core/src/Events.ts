/**
 * Base class for event emitters
 */
export class Events {
    private handlers: Map<string, Set<Function>> = new Map();

    /**
     * Register an event handler
     */
    on(name: string, callback: Function): EventRef {
        if (!this.handlers.has(name)) {
            this.handlers.set(name, new Set());
        }

        this.handlers.get(name)!.add(callback);

        // Return event ref for unregistering
        return {
            unload: () => {
                this.off(name, callback);
            },
        };
    }

    /**
     * Unregister an event handler
     */
    off(name: string, callback: Function): void {
        const handlers = this.handlers.get(name);
        if (handlers) {
            handlers.delete(callback);
            if (handlers.size === 0) {
                this.handlers.delete(name);
            }
        }
    }

    /**
     * Unregister all handlers for an event
     */
    offAll(name?: string): void {
        if (name) {
            this.handlers.delete(name);
        } else {
            this.handlers.clear();
        }
    }

    /**
     * Trigger an event
     */
    protected trigger(name: string, ...args: any[]): void {
        const handlers = this.handlers.get(name);
        if (handlers) {
            for (const handler of handlers) {
                try {
                    handler(...args);
                } catch (error) {
                    console.error(`Error in event handler for "${name}":`, error);
                }
            }
        }
    }
}

/**
 * Event reference for cleanup
 */
export interface EventRef {
    unload(): void;
}
