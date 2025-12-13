import { WidgetType } from '@codemirror/view';

/**
 * Language Badge Widget for Code Blocks
 * Displays the programming language in the top-right corner of the code block
 */
export class LanguageBadgeWidget extends WidgetType {
    constructor(
        private language: string,
        private attrs?: Record<string, string>,
    ) {
        super();
    }

    toDOM(): HTMLElement {
        const span = document.createSpan({
            cls: 'cm-codeblock-language-badge',
            text: this.language || 'text',
        });

        // Apply custom attributes
        if (this.attrs) {
            for (const [key, value] of Object.entries(this.attrs)) {
                span.setAttribute(key, value);
            }
        }

        return span;
    }

    eq(other: LanguageBadgeWidget): boolean {
        return (
            other.language === this.language &&
            JSON.stringify(other.attrs) === JSON.stringify(this.attrs)
        );
    }

    ignoreEvent(): boolean {
        return true;
    }
}
