import { WidgetType } from '@codemirror/view';

/**
 * Language Badge Widget for Code Blocks
 * Displays the programming language in the top-right corner of the code block
 */
export class LanguageBadgeWidget extends WidgetType {
    constructor(private language: string) {
        super();
    }

    toDOM(): HTMLElement {
        return document.createSpan({
            cls: 'cm-codeblock-language-badge',
            text: this.language || 'text',
        });
    }

    eq(other: LanguageBadgeWidget): boolean {
        return other.language === this.language;
    }

    ignoreEvent(): boolean {
        return true;
    }
}
