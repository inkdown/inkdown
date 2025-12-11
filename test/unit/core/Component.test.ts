import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Component } from '@inkdown/core/Component';

// Test subclasses
class TestComponent extends Component {
    onloadCalled = false;
    onunloadCalled = false;

    onload(): void {
        this.onloadCalled = true;
    }

    onunload(): void {
        this.onunloadCalled = true;
    }
}

class ChildComponent extends Component {
    onloadCalled = false;
    onunloadCalled = false;

    onload(): void {
        this.onloadCalled = true;
    }

    onunload(): void {
        this.onunloadCalled = true;
    }
}

describe('Component', () => {
    let component: TestComponent;

    beforeEach(() => {
        component = new TestComponent();
    });

    describe('load', () => {
        it('should call onload', () => {
            component.load();

            expect(component.onloadCalled).toBe(true);
        });

        it('should only call onload once', () => {
            component.load();
            component.onloadCalled = false;
            component.load();

            expect(component.onloadCalled).toBe(false);
        });
    });

    describe('unload', () => {
        it('should call onunload', () => {
            component.load();
            component.unload();

            expect(component.onunloadCalled).toBe(true);
        });

        it('should not call onunload if not loaded', () => {
            component.unload();

            expect(component.onunloadCalled).toBe(false);
        });

        it('should only call onunload once', () => {
            component.load();
            component.unload();
            component.onunloadCalled = false;
            component.unload();

            expect(component.onunloadCalled).toBe(false);
        });
    });

    describe('addChild', () => {
        it('should add a child component', () => {
            const child = new ChildComponent();
            const returned = component.addChild(child);

            expect(returned).toBe(child);
        });

        it('should load child immediately if parent is loaded', () => {
            const child = new ChildComponent();
            component.load();

            component.addChild(child);

            expect(child.onloadCalled).toBe(true);
        });

        it('should not load child if parent is not loaded', () => {
            const child = new ChildComponent();

            component.addChild(child);

            expect(child.onloadCalled).toBe(false);
        });

        it('should unload children when parent unloads', () => {
            const child = new ChildComponent();
            component.load();
            component.addChild(child);

            component.unload();

            expect(child.onunloadCalled).toBe(true);
        });

        it('should unload multiple children', () => {
            const child1 = new ChildComponent();
            const child2 = new ChildComponent();
            const child3 = new ChildComponent();
            component.load();
            component.addChild(child1);
            component.addChild(child2);
            component.addChild(child3);

            component.unload();

            expect(child1.onunloadCalled).toBe(true);
            expect(child2.onunloadCalled).toBe(true);
            expect(child3.onunloadCalled).toBe(true);
        });
    });

    describe('removeChild', () => {
        it('should remove and unload a child', () => {
            const child = new ChildComponent();
            component.load();
            component.addChild(child);

            component.removeChild(child);

            expect(child.onunloadCalled).toBe(true);
        });

        it('should not throw when removing non-existent child', () => {
            const child = new ChildComponent();

            // Should not throw
            component.removeChild(child);
        });

        it('should only remove the specified child', () => {
            const child1 = new ChildComponent();
            const child2 = new ChildComponent();
            component.load();
            component.addChild(child1);
            component.addChild(child2);

            component.removeChild(child1);

            expect(child1.onunloadCalled).toBe(true);
            expect(child2.onunloadCalled).toBe(false);
        });
    });

    describe('register', () => {
        it('should call callback on unload', () => {
            const callback = vi.fn();
            component.load();

            component.register(callback);
            component.unload();

            expect(callback).toHaveBeenCalled();
        });

        it('should handle multiple registered callbacks', () => {
            const callback1 = vi.fn();
            const callback2 = vi.fn();
            component.load();

            component.register(callback1);
            component.register(callback2);
            component.unload();

            expect(callback1).toHaveBeenCalled();
            expect(callback2).toHaveBeenCalled();
        });
    });

    describe('registerInterval', () => {
        it('should return the interval ID', () => {
            const intervalId = 123;

            const result = component.registerInterval(intervalId);

            expect(result).toBe(intervalId);
        });

        it('should register a cleanup callback', () => {
            // registerInterval should call register() internally
            const registerSpy = vi.spyOn(component, 'register');
            const intervalId = 123;

            component.registerInterval(intervalId);

            expect(registerSpy).toHaveBeenCalled();
        });
    });

    describe('nested children', () => {
        it('should unload nested children recursively', () => {
            const child = new ChildComponent();
            const grandchild = new ChildComponent();

            component.load();
            component.addChild(child);
            child.addChild(grandchild);

            component.unload();

            expect(child.onunloadCalled).toBe(true);
            expect(grandchild.onunloadCalled).toBe(true);
        });
    });

    describe('lifecycle order', () => {
        it('should unload children before self', () => {
            const order: string[] = [];
            const child = new (class extends Component {
                onunload() {
                    order.push('child');
                }
            })();
            const parent = new (class extends Component {
                onunload() {
                    order.push('parent');
                }
            })();

            parent.load();
            parent.addChild(child);
            parent.unload();

            expect(order).toEqual(['child', 'parent']);
        });
    });

    describe('base Component class', () => {
        it('should have empty onload implementation', () => {
            const baseComponent = new Component();
            // Should not throw
            baseComponent.load();
        });

        it('should have empty onunload implementation', () => {
            const baseComponent = new Component();
            baseComponent.load();
            // Should not throw
            baseComponent.unload();
        });
    });
});
