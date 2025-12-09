import { visit } from 'unist-util-visit';
import type { Root, Text, Parent } from 'mdast';

/**
 * Remark plugin to support ==highlight== syntax
 * Converts ==text== to <mark>text</mark> for preview rendering
 */
export function remarkHighlight() {
    return (tree: Root) => {
        visit(tree, 'text', (node: Text, index: number | undefined, parent: Parent | undefined) => {
            if (!parent || index === undefined) return;

            const text = node.value;
            const regex = /==(.+?)==/g;
            
            if (!regex.test(text)) return;

            // Split text into parts with highlights
            const parts: any[] = [];
            let lastIndex = 0;
            let match;
            
            // Reset regex
            regex.lastIndex = 0;
            
            while ((match = regex.exec(text)) !== null) {
                // Add text before highlight
                if (match.index > lastIndex) {
                    parts.push({
                        type: 'text',
                        value: text.slice(lastIndex, match.index),
                    });
                }
                
                // Add highlight as HTML
                parts.push({
                    type: 'html',
                    value: `<mark>${match[1]}</mark>`,
                });
                
                lastIndex = regex.lastIndex;
            }
            
            // Add remaining text
            if (lastIndex < text.length) {
                parts.push({
                    type: 'text',
                    value: text.slice(lastIndex),
                });
            }
            
            // Replace the text node with the parts
            if (parts.length > 0) {
                parent.children.splice(index, 1, ...parts);
            }
        });
    };
}
