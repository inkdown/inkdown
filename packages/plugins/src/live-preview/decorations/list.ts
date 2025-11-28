import type { Range } from '@codemirror/state';
import type { EditorView } from '@codemirror/view';
import { Decoration, WidgetType } from '@codemirror/view';
import { shouldDecorate } from '../utils/selection';

/**
 * Create decorations for list items
 * Styles the list markers (-, *, +, 1., 2., etc.)
 * Also handles checklists (- [ ] or - [x])
 */
export function createListDecorations(
    view: EditorView,
    from: number,
    to: number,
): Range<Decoration>[] {
    const decorations: Range<Decoration>[] = [];

    if (!shouldDecorate(view, from, to)) {
        return decorations;
    }

    const text = view.state.doc.sliceString(from, to);

    // Match unordered list markers: -, *, +
    // Match ordered list markers: 1., 2., etc.
    // Match checklists: - [ ] or - [x]
    const listRegex = /^(\s*)([-*+]|\d+\.)(\s+)(\[[ xX]\])?\s+/;
    const match = listRegex.exec(text);

    // console.log('List decoration check:', { text, match: !!match, from, to }); // Debug logging

    if (match) {
        const indent = match[1];
        const bullet = match[2];
        const spacer = match[3];
        const checkbox = match[4]; // [ ] or [x]

        const markerStart = from + indent.length;

        if (checkbox) {
            // It's a checklist item
            const checkboxStart = markerStart + bullet.length + spacer.length;
            const checkboxEnd = checkboxStart + checkbox.length;

            // Hide the markdown checkbox
            decorations.push(
                Decoration.replace({
                    widget: new CheckboxWidget(checkbox.includes('x') || checkbox.includes('X')),
                    block: false,
                }).range(checkboxStart, checkboxEnd),
            );

            // Style the bullet normally
            decorations.push(
                Decoration.mark({
                    class: 'cm-list-marker',
                    attributes: { style: 'color: var(--cm-list-marker);' },
                }).range(markerStart, markerStart + bullet.length),
            );
        } else {
            // Regular list item
            const markerEnd = from + match[0].length;

            // Check if it's an unordered list (-, *, +)
            const isUnordered = ['-', '*', '+'].includes(bullet);

            if (isUnordered) {
                // Replace the bullet with a styled dot widget
                decorations.push(
                    Decoration.replace({
                        widget: new BulletWidget(),
                        block: false,
                    }).range(markerStart, markerStart + bullet.length),
                );
            } else {
                // Ordered list (1., 2.) - just style it
                decorations.push(
                    Decoration.mark({
                        class: 'cm-list-marker',
                        attributes: {
                            style: 'color: var(--cm-list-marker); font-weight: 500;',
                        },
                    }).range(markerStart, markerEnd),
                );
            }
        }
    }

    return decorations;
}

class BulletWidget extends WidgetType {
    toDOM() {
        return document.createSpan({ cls: 'cm-list-bullet' });
    }

    ignoreEvent() {
        return true;
    }
}

class CheckboxWidget extends WidgetType {
    constructor(private checked: boolean) {
        super();
    }

    toDOM() {
        const input = document.createEl('input', {
            type: 'checkbox',
            cls: 'cm-checklist-checkbox',
            attr: {
                style: 'margin-right: 0.5em;',
            },
        });
        input.checked = this.checked;

        // Prevent editing when clicking checkbox
        input.addEventListener('mousedown', (e) => {
            // In a real implementation, this would toggle the markdown
            // For now, we just prevent focus stealing
            e.preventDefault();
        });

        return input;
    }

    ignoreEvent() {
        return false;
    }
}
