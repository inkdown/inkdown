import { WidgetType } from '@codemirror/view';

/**
 * Copy Button Widget for Code Blocks
 * Displays when cursor is inside the code block
 * Allows copying the entire code block content
 */
export class CopyButtonWidget extends WidgetType {
    constructor(
        private codeContent: string,
        private attrs?: Record<string, string>,
    ) {
        super();
    }

    toDOM(): HTMLElement {
        const button = document.createElement('button');
        button.className = 'cm-codeblock-copy-button';
        button.textContent = 'Copy';
        button.title = 'Copy code';
        
        // Apply custom attributes
        if (this.attrs) {
            for (const [key, value] of Object.entries(this.attrs)) {
                button.setAttribute(key, value);
            }
        }

        button.addEventListener('click', async (e) => {
            e.preventDefault();
            e.stopPropagation();

            try {
                // Try to use Clipboard API
                if (navigator.clipboard && navigator.clipboard.writeText) {
                    await navigator.clipboard.writeText(this.codeContent);
                    button.textContent = 'Copied!';
                    button.classList.add('copied');

                    setTimeout(() => {
                        button.textContent = 'Copy';
                        button.classList.remove('copied');
                    }, 2000);
                } else {
                    // Fallback for older browsers
                    const textarea = document.createElement('textarea');
                    textarea.value = this.codeContent;
                    textarea.style.position = 'fixed';
                    textarea.style.opacity = '0';
                    document.body.appendChild(textarea);
                    textarea.select();
                    document.execCommand('copy');
                    document.body.removeChild(textarea);

                    button.textContent = 'Copied!';
                    setTimeout(() => {
                        button.textContent = 'Copy';
                    }, 2000);
                }
            } catch (error) {
                console.error('Failed to copy code:', error);
                button.textContent = 'Failed';
                setTimeout(() => {
                    button.textContent = 'Copy';
                }, 2000);
            }
        });

        return button;
    }

    eq(other: CopyButtonWidget): boolean {
        return other.codeContent === this.codeContent &&
               JSON.stringify(other.attrs) === JSON.stringify(this.attrs);
    }

    ignoreEvent(): boolean {
        return false; // Allow click events
    }
}
