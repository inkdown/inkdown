import type { App } from '../App';

/**
 * Modal - Base class for creating modal dialogs
 *
 * Extend this class and override onOpen() to create custom modals.
 *
 * @example
 * ```ts
 * class MyModal extends Modal {
 *   result: string
 *
 *   constructor(app: App) {
 *     super(app)
 *   }
 *
 *   onOpen() {
 *     const { contentEl } = this
 *     contentEl.createEl('h2', { text: 'My Modal' })
 *
 *     new Setting(contentEl)
 *       .setName('Enter a value')
 *       .addText(text => text
 *         .setPlaceholder('Type here...')
 *         .onChange(value => this.result = value))
 *
 *     new Setting(contentEl)
 *       .addButton(btn => btn
 *         .setButtonText('Submit')
 *         .setCta()
 *         .onClick(() => {
 *           // Handle submit
 *           this.close()
 *         }))
 *   }
 *
 *   onClose() {
 *     const { contentEl } = this
 *     contentEl.empty()
 *   }
 * }
 * ```
 */
export abstract class Modal {
    /**
     * Reference to the app instance
     */
    app: App;

    /**
     * The modal overlay element
     */
    modalEl: HTMLElement;

    /**
     * The modal container element
     */
    containerEl: HTMLElement;

    /**
     * The title element (header area)
     */
    titleEl: HTMLElement;

    /**
     * The content element where you add your modal content
     */
    contentEl: HTMLElement;

    /**
     * The close button element
     */
    closeButtonEl: HTMLElement;

    /**
     * Whether the modal should close when clicking outside
     */
    shouldCloseOnOverlayClick = true;

    /**
     * Scope for keyboard shortcuts in this modal
     */
    scope: KeyboardScope;

    private isOpen = false;
    private boundKeyHandler: (e: KeyboardEvent) => void;
    private boundOverlayClickHandler: (e: MouseEvent) => void;

    constructor(app: App) {
        this.app = app;
        this.scope = new KeyboardScope();

        // Create modal structure
        this.modalEl = document.createDiv({ cls: 'modal-container' });

        const overlay = this.modalEl.createDiv({ cls: 'modal-bg' });

        this.containerEl = this.modalEl.createDiv({
            cls: 'modal',
            attr: {
                role: 'dialog',
                'aria-modal': 'true',
            },
        });

        // Close button
        this.closeButtonEl = this.containerEl.createEl('button', {
            cls: 'modal-close-button',
            text: '×',
            attr: { 'aria-label': 'Close' },
        });

        // Title area
        this.titleEl = this.containerEl.createDiv({ cls: 'modal-title' });

        // Content area
        this.contentEl = this.containerEl.createDiv({ cls: 'modal-content' });

        // Bind event handlers
        this.boundKeyHandler = this.handleKeyDown.bind(this);
        this.boundOverlayClickHandler = this.handleOverlayClick.bind(this);

        // Setup close button
        this.closeButtonEl.addEventListener('click', () => this.close());
    }

    /**
     * Set the title of the modal
     */
    setTitle(title: string): this {
        this.titleEl.textContent = title;
        return this;
    }

    /**
     * Set the content of the modal (replaces existing content)
     */
    setContent(content: string | DocumentFragment): this {
        this.contentEl.empty();
        if (typeof content === 'string') {
            this.contentEl.textContent = content;
        } else {
            this.contentEl.appendChild(content);
        }
        return this;
    }

    /**
     * Open the modal
     */
    open(): void {
        if (this.isOpen) return;
        this.isOpen = true;

        document.body.appendChild(this.modalEl);
        document.body.addClass('modal-open');

        // Add event listeners
        document.addEventListener('keydown', this.boundKeyHandler);
        const bgEl = this.modalEl.querySelector('.modal-bg');
        if (bgEl) {
            bgEl.addEventListener('click', this.boundOverlayClickHandler as EventListener);
        }

        // Focus the modal for accessibility
        this.containerEl.setAttribute('tabindex', '-1');
        this.containerEl.focus();

        // Animation
        requestAnimationFrame(() => {
            this.modalEl.addClass('is-active');
        });

        this.onOpen();
    }

    /**
     * Close the modal
     */
    close(): void {
        if (!this.isOpen) return;
        this.isOpen = false;

        this.modalEl.removeClass('is-active');

        // Remove event listeners
        document.removeEventListener('keydown', this.boundKeyHandler);
        const bgEl = this.modalEl.querySelector('.modal-bg');
        if (bgEl) {
            bgEl.removeEventListener('click', this.boundOverlayClickHandler as EventListener);
        }

        // Remove from DOM after animation
        setTimeout(() => {
            if (this.modalEl.parentNode) {
                this.modalEl.parentNode.removeChild(this.modalEl);
            }
            document.body.removeClass('modal-open');
        }, 150);

        this.onClose();
    }

    /**
     * Called when the modal is opened.
     * Override this to set up your modal content.
     */
    onOpen(): void {
        // Override in subclass
    }

    /**
     * Called when the modal is closed.
     * Override this to clean up resources.
     */
    onClose(): void {
        // Override in subclass
    }

    private handleKeyDown(e: KeyboardEvent): void {
        if (e.key === 'Escape') {
            this.close();
        }
    }

    private handleOverlayClick(_e: MouseEvent): void {
        if (this.shouldCloseOnOverlayClick) {
            this.close();
        }
    }
}

/**
 * Keyboard scope for managing keyboard shortcuts within a context
 */
export class KeyboardScope {
    private handlers: Map<string, ((e: KeyboardEvent) => boolean | void)[]> = new Map();

    /**
     * Register a keyboard handler
     * @param modifiers Array of modifiers: 'Ctrl', 'Meta', 'Alt', 'Shift'
     * @param key The key to handle
     * @param callback The handler function. Return false to prevent default.
     */
    register(
        modifiers: string[],
        key: string,
        callback: (e: KeyboardEvent) => boolean | void,
    ): void {
        const combo = [...modifiers.sort(), key].join('+').toLowerCase();
        if (!this.handlers.has(combo)) {
            this.handlers.set(combo, []);
        }
        this.handlers.get(combo)!.push(callback);
    }

    /**
     * Unregister all handlers for a key combo
     */
    unregister(modifiers: string[], key: string): void {
        const combo = [...modifiers.sort(), key].join('+').toLowerCase();
        this.handlers.delete(combo);
    }

    /**
     * Handle a keyboard event
     */
    handleKey(event: KeyboardEvent): boolean {
        const modifiers: string[] = [];
        if (event.ctrlKey) modifiers.push('ctrl');
        if (event.metaKey) modifiers.push('meta');
        if (event.altKey) modifiers.push('alt');
        if (event.shiftKey) modifiers.push('shift');

        const combo = [...modifiers.sort(), event.key.toLowerCase()].join('+');
        const handlers = this.handlers.get(combo);

        if (handlers) {
            for (const handler of handlers) {
                const result = handler(event);
                if (result === false) {
                    event.preventDefault();
                    return false;
                }
            }
        }

        return true;
    }
}

/**
 * ConfirmModal - A simple confirmation modal
 *
 * @example
 * ```ts
 * const modal = new ConfirmModal(app)
 * modal.setTitle('Confirm Delete')
 * modal.setMessage('Are you sure you want to delete this item?')
 * modal.setConfirmText('Delete')
 * modal.onConfirm(() => {
 *   // Delete the item
 * })
 * modal.open()
 * ```
 */
export class ConfirmModal extends Modal {
    private message = '';
    private confirmText = 'Confirm';
    private cancelText = 'Cancel';
    private confirmCallback?: () => void;
    private cancelCallback?: () => void;
    private confirmButtonClass = '';

    constructor(app: App) {
        super(app);
        this.containerEl.addClass('confirm-modal');
    }

    setMessage(message: string): this {
        this.message = message;
        return this;
    }

    setConfirmText(text: string): this {
        this.confirmText = text;
        return this;
    }

    setCancelText(text: string): this {
        this.cancelText = text;
        return this;
    }

    /**
     * Set the confirm button to use warning/danger styling
     */
    setWarning(isWarning = true): this {
        this.confirmButtonClass = isWarning ? 'mod-warning' : '';
        return this;
    }

    onConfirm(callback: () => void): this {
        this.confirmCallback = callback;
        return this;
    }

    onCancel(callback: () => void): this {
        this.cancelCallback = callback;
        return this;
    }

    onOpen(): void {
        const { contentEl } = this;
        contentEl.empty();

        // Message
        contentEl.createDiv({ cls: 'confirm-modal-message', text: this.message });

        // Buttons
        const buttonContainer = contentEl.createDiv({ cls: 'modal-button-container' });

        const cancelBtn = buttonContainer.createEl('button', {
            cls: 'mod-cancel',
            text: this.cancelText,
        });
        cancelBtn.addEventListener('click', () => {
            this.cancelCallback?.();
            this.close();
        });

        const confirmBtn = buttonContainer.createEl('button', {
            cls: `mod-cta ${this.confirmButtonClass}`.trim(),
            text: this.confirmText,
        });
        confirmBtn.addEventListener('click', () => {
            this.confirmCallback?.();
            this.close();
        });
    }

    onClose(): void {
        this.contentEl.empty();
    }
}

export default Modal;
