import { visit } from 'unist-util-visit';
import type { Root, Blockquote, Paragraph, Text } from 'mdast';

/**
 * Remark plugin to support GitHub-style callouts/alerts
 * Converts > [!TYPE] syntax to styled blockquotes
 */

type CalloutType = 'NOTE' | 'TIP' | 'IMPORTANT' | 'WARNING' | 'CAUTION';

export function remarkCallout() {
    return (tree: Root) => {
        visit(tree, 'blockquote', (node: Blockquote, index, parent) => {
            if (!parent || index === undefined) return;

            // Check if first paragraph starts with [!TYPE]
            const firstChild = node.children[0];
            if (firstChild?.type !== 'paragraph') return;

            const paragraph = firstChild as Paragraph;
            const firstText = paragraph.children[0];
            if (firstText?.type !== 'text') return;

            const text = (firstText as Text).value;
            const match = /^\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]\s*(.*)$/i.exec(text);
            
            if (!match) return;

            const type = match[1].toUpperCase() as CalloutType;
            const title = match[2].trim();

            // Remove the [!TYPE] text from the first paragraph
            (firstText as Text).value = title;
            
            // If title is empty and that was the only content, remove the paragraph
            if (!title && paragraph.children.length === 1) {
                node.children.shift();
            }

            // Add data attributes to the blockquote for styling
            if (!node.data) {
                node.data = {};
            }
            
            (node.data as any).hProperties = {
                className: `callout callout-${type.toLowerCase()}`,
                'data-callout-type': type.toLowerCase(),
                'data-callout-title': title || getDefaultTitle(type),
            };
        });
    };
}

function getDefaultTitle(type: CalloutType): string {
    const titles: Record<CalloutType, string> = {
        NOTE: 'Note',
        TIP: 'Tip',
        IMPORTANT: 'Important',
        WARNING: 'Warning',
        CAUTION: 'Caution',
    };
    return titles[type];
}
