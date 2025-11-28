/**
 * Component - Base class for lifecycle management
 */
export class Component {
    private _children: Component[] = [];
    private _loaded = false;

    /**
     * Load the component
     */
    load(): void {
        if (this._loaded) return;
        this._loaded = true;
        this.onload();
    }

    /**
     * Called when the component is loaded
     */
    onload(): void {
        // Override in subclass
    }

    /**
     * Unload the component
     */
    unload(): void {
        if (!this._loaded) return;

        // Unload children first
        for (const child of this._children) {
            child.unload();
        }
        this._children = [];

        this._loaded = false;
        this.onunload();
    }

    /**
     * Called when the component is unloaded
     */
    onunload(): void {
        // Override in subclass
    }

    /**
     * Add a child component
     * The child will be automatically unloaded when this component is unloaded
     */
    addChild<T extends Component>(component: T): T {
        this._children.push(component);
        if (this._loaded) {
            component.load();
        }
        return component;
    }

    /**
     * Remove a child component
     */
    removeChild(component: Component): void {
        const index = this._children.indexOf(component);
        if (index !== -1) {
            this._children.splice(index, 1);
            component.unload();
        }
    }

    /**
     * Register a callback to be called when unloading
     */
    register(cb: () => void): void {
        // Simple implementation - in reality this would be more complex
        // For now we just wrap it in a component
        const component = new (class extends Component {
            onunload() {
                cb();
            }
        })();
        this.addChild(component);
    }

    /**
     * Register an interval to be cleared when unloading
     */
    registerInterval(id: number): number {
        this.register(() => window.clearInterval(id));
        return id;
    }
}
