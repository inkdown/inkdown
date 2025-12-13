/**
 * Implementation of DOM extensions's API
 */

export interface DomElementInfo {
    /**
     * The class to be added. Can be a single string, an array of strings, or a space-separated string.
     */
    cls?: string | string[];
    /**
     * The text content of the element.
     */
    text?: string;
    /**
     * The title attribute of the element.
     */
    title?: string;
    /**
     * The value attribute of the element.
     */
    value?: string;
    /**
     * The placeholder attribute of the element.
     */
    placeholder?: string;
    /**
     * The type attribute of the element.
     */
    type?: string;
    /**
     * The href attribute of the element.
     */
    href?: string;
    /**
     * The parent element to append this element to.
     */
    parent?: HTMLElement;
    /**
     * Other attributes to set on the element.
     */
    attr?: { [key: string]: string | number | boolean | null };
    /**
     * Whether to prepend the element instead of appending.
     */
    prepend?: boolean;
}

declare global {
    interface HTMLElement {
        /**
         * Creates a new element and appends it to this element.
         */
        createEl<K extends keyof HTMLElementTagNameMap>(
            tag: K,
            o?: DomElementInfo | string,
            callback?: (el: HTMLElementTagNameMap[K]) => void,
        ): HTMLElementTagNameMap[K];

        /**
         * Creates a new div element and appends it to this element.
         */
        createDiv(
            o?: DomElementInfo | string,
            callback?: (el: HTMLDivElement) => void,
        ): HTMLDivElement;

        /**
         * Creates a new span element and appends it to this element.
         */
        createSpan(
            o?: DomElementInfo | string,
            callback?: (el: HTMLSpanElement) => void,
        ): HTMLSpanElement;

        /**
         * Sets the text content of this element.
         */
        setText(text: string): void;

        /**
         * Adds classes to this element.
         */
        addClass(...classes: string[]): void;

        /**
         * Removes classes from this element.
         */
        removeClass(...classes: string[]): void;

        /**
         * Toggles a class on this element.
         */
        toggleClass(cls: string, value: boolean): void;

        /**
         * Empties the element (removes all children).
         */
        empty(): void;
    }

    interface Document {
        /**
         * Creates a new element.
         */
        createEl<K extends keyof HTMLElementTagNameMap>(
            tag: K,
            o?: DomElementInfo | string,
            callback?: (el: HTMLElementTagNameMap[K]) => void,
        ): HTMLElementTagNameMap[K];

        /**
         * Creates a new div element.
         */
        createDiv(
            o?: DomElementInfo | string,
            callback?: (el: HTMLDivElement) => void,
        ): HTMLDivElement;

        /**
         * Creates a new span element.
         */
        createSpan(
            o?: DomElementInfo | string,
            callback?: (el: HTMLSpanElement) => void,
        ): HTMLSpanElement;
    }
}

// Helper to handle DomElementInfo
function applyDomInfo(el: HTMLElement, o?: DomElementInfo | string) {
    if (typeof o === 'string') {
        el.textContent = o;
    } else if (o) {
        if (o.cls) {
            if (Array.isArray(o.cls)) {
                el.classList.add(...o.cls);
            } else {
                // Split by space to handle multiple classes in string
                el.classList.add(...o.cls.split(' ').filter((c: string) => c.length > 0));
            }
        }
        if (o.text) el.textContent = o.text;
        if (o.title) el.title = o.title;
        if (o.value !== undefined && 'value' in el) (el as any).value = o.value;
        if (o.placeholder && 'placeholder' in el) (el as any).placeholder = o.placeholder;
        if (o.type && 'type' in el) (el as any).type = o.type;
        if (o.href && 'href' in el) (el as any).href = o.href;

        if (o.attr) {
            for (const key in o.attr) {
                if (Object.hasOwn(o.attr, key)) {
                    const val = o.attr[key];
                    if (val === null) {
                        el.removeAttribute(key);
                    } else {
                        el.setAttribute(key, String(val));
                    }
                }
            }
        }

        if (o.parent) {
            o.parent.appendChild(el);
        }
    }
}

// HTMLElement extensions
HTMLElement.prototype.createEl = function <K extends keyof HTMLElementTagNameMap>(
    tag: K,
    o?: DomElementInfo | string,
    callback?: (el: HTMLElementTagNameMap[K]) => void,
): HTMLElementTagNameMap[K] {
    const el = document.createElement(tag);
    applyDomInfo(el, o);

    if (o && typeof o !== 'string' && o.prepend && this.firstChild) {
        this.insertBefore(el, this.firstChild);
    } else {
        this.appendChild(el);
    }

    if (callback) callback(el);
    return el;
};

HTMLElement.prototype.createDiv = function (
    o?: DomElementInfo | string,
    callback?: (el: HTMLDivElement) => void,
): HTMLDivElement {
    return this.createEl('div', o, callback);
};

HTMLElement.prototype.createSpan = function (
    o?: any | string,
    callback?: (el: HTMLSpanElement) => void,
): HTMLSpanElement {
    return this.createEl('span', o, callback);
};

HTMLElement.prototype.setText = function (text: string): void {
    // Check if element has icon children that need to be preserved
    const iconElement = this.querySelector('.lucide-icon');

    if (iconElement) {
        // Remove existing text nodes and non-icon elements but keep the icon
        const childNodes = Array.from(this.childNodes);
        for (const node of childNodes) {
            if (node !== iconElement) {
                this.removeChild(node);
            }
        }
        // Append new text node after the icon
        this.appendChild(document.createTextNode(text));
    } else {
        // No icon, just set text content directly
        this.textContent = text;
    }
};

HTMLElement.prototype.addClass = function (...classes: string[]): void {
    for (const cls of classes) {
        if (!cls) continue;
        // Handle space-separated classes
        const parts = cls.split(' ');
        for (const part of parts) {
            if (part) this.classList.add(part);
        }
    }
};

HTMLElement.prototype.removeClass = function (...classes: string[]): void {
    for (const cls of classes) {
        if (!cls) continue;
        const parts = cls.split(' ');
        for (const part of parts) {
            if (part) this.classList.remove(part);
        }
    }
};

HTMLElement.prototype.toggleClass = function (cls: string, value: boolean): void {
    if (value) {
        this.addClass(cls);
    } else {
        this.removeClass(cls);
    }
};

HTMLElement.prototype.empty = function (): void {
    while (this.firstChild) {
        this.removeChild(this.firstChild);
    }
};

// Document extensions (for creating detached elements)
Document.prototype.createEl = <K extends keyof HTMLElementTagNameMap>(
    tag: K,
    o?: any | string,
    callback?: (el: HTMLElementTagNameMap[K]) => void,
): HTMLElementTagNameMap[K] => {
    const el = document.createElement(tag);
    applyDomInfo(el, o);
    if (callback) callback(el);
    return el;
};

Document.prototype.createDiv = function (
    o?: any | string,
    callback?: (el: HTMLDivElement) => void,
): HTMLDivElement {
    return this.createEl('div', o, callback);
};

Document.prototype.createSpan = function (
    o?: any | string,
    callback?: (el: HTMLSpanElement) => void,
): HTMLSpanElement {
    return this.createEl('span', o, callback);
};
