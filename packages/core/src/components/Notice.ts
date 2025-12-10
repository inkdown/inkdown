/**
 * Notice - Toast notification class
 *
 * Create a temporary notification that automatically disappears.
 *
 * @example
 * ```ts
 * // Simple notification
 * new Notice('File saved successfully!')
 *
 * // Notification with custom duration (in milliseconds)
 * new Notice('Processing...', 5000)
 *
 * // Notification with fragment for custom content
 * const fragment = document.createDocumentFragment()
 * fragment.createEl('strong', { text: 'Success!' })
 * fragment.createSpan({ text: ' Your file was saved.' })
 * new Notice(fragment)
 *
 * // Manual control
 * const notice = new Notice('Uploading...', 0) // 0 = won't auto-hide
 * // ... later
 * notice.setMessage('Upload complete!')
 * notice.hide()
 * ```
 */
export class Notice {
    /**
     * The notice element
     */
    noticeEl: HTMLElement;

    private static container: HTMLElement | null = null;
    private hideTimeout: ReturnType<typeof setTimeout> | null = null;
    private isHiding = false;

    /**
     * Create a new notice
     * @param message The message to display (string or DocumentFragment)
     * @param duration How long to show the notice in milliseconds. Default is 5000. Use 0 for persistent notice.
     */
    constructor(message: string | DocumentFragment, duration = 5000) {
        // Ensure container exists
        Notice.ensureContainer();

        // Create notice element
        this.noticeEl = document.createDiv({ cls: 'notice' });

        if (typeof message === 'string') {
            this.noticeEl.setText(message);
        } else {
            this.noticeEl.appendChild(message);
        }

        // Add to container
        Notice.container?.appendChild(this.noticeEl);

        // Animate in
        requestAnimationFrame(() => {
            this.noticeEl.addClass('is-visible');
        });

        // Auto-hide if duration > 0
        if (duration > 0) {
            this.hideTimeout = setTimeout(() => {
                this.hide();
            }, duration);
        }
    }

    /**
     * Update the message of the notice
     */
    setMessage(message: string | DocumentFragment): this {
        this.noticeEl.empty();
        if (typeof message === 'string') {
            this.noticeEl.setText(message);
        } else {
            this.noticeEl.appendChild(message);
        }
        return this;
    }

    /**
     * Hide the notice
     */
    hide(): void {
        if (this.isHiding) return;
        this.isHiding = true;

        if (this.hideTimeout) {
            clearTimeout(this.hideTimeout);
            this.hideTimeout = null;
        }

        this.noticeEl.removeClass('is-visible');
        this.noticeEl.addClass('is-hidden');

        // Remove from DOM after animation
        setTimeout(() => {
            if (this.noticeEl.parentNode) {
                this.noticeEl.parentNode.removeChild(this.noticeEl);
            }
            // Clean up container if empty
            Notice.cleanupContainer();
        }, 300);
    }

    private static ensureContainer(): void {
        if (!Notice.container || !document.body.contains(Notice.container)) {
            Notice.container = document.createDiv({ cls: 'notice-container' });
            document.body.appendChild(Notice.container);
        }
    }

    private static cleanupContainer(): void {
        if (Notice.container && Notice.container.children.length === 0) {
            if (Notice.container.parentNode) {
                Notice.container.parentNode.removeChild(Notice.container);
            }
            Notice.container = null;
        }
    }
}

/**
 * Create CSS styles for notices
 */
export function injectNoticeStyles(): void {
    const styleId = 'inkdown-notice-styles';
    if (document.getElementById(styleId)) return;

    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
    .notice-container {
      position: fixed;
      bottom: 20px;
      right: 20px;
      z-index: 10000;
      display: flex;
      flex-direction: column;
      gap: 8px;
      pointer-events: none;
    }

    .notice {
      background: var(--background-modifier-message);
      color: var(--text-normal);
      padding: 10px 16px;
      border-radius: 6px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
      max-width: 350px;
      word-wrap: break-word;
      pointer-events: auto;
      cursor: default;
      opacity: 0;
      transform: translateX(100%);
      transition: opacity 0.2s ease, transform 0.2s ease;
    }

    .notice.is-visible {
      opacity: 1;
      transform: translateX(0);
    }

    .notice.is-hidden {
      opacity: 0;
      transform: translateX(100%);
    }

    .notice:hover {
      background: var(--background-modifier-hover);
    }

    /* Default theme variables fallback */
    :root {
      --background-modifier-message: #363636;
      --background-modifier-hover: #404040;
      --text-normal: #dcddde;
    }

    /* Light theme */
    .theme-light {
      --background-modifier-message: #ffffff;
      --background-modifier-hover: #f5f5f5;
      --text-normal: #1a1a1a;
    }

    .theme-light .notice {
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      border: 1px solid var(--background-modifier-border);
    }
  `;
    document.head.appendChild(style);
}

export default Notice;
