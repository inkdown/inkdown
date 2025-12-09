import type { Range } from '@codemirror/state';
import type { EditorView } from '@codemirror/view';
import { Decoration, WidgetType } from '@codemirror/view';

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

    // For lists, we want to show the decoration even when cursor is on the line
    // Only hide if cursor is directly on the bullet itself
    const selection = view.state.selection.main;
    const text = view.state.doc.sliceString(from, to);

    // Match unordered list markers: -, *, +
    // Match ordered list markers: 1., 2., etc.
    // Match checklists: - [ ] or - [x]
    const listRegex = /^(\s*)([-*+]|\d+\.)(\s+)(\[[ xX]\])?\s+/;
    const match = listRegex.exec(text);

    console.log('List decoration check:', { text, match: !!match, from, to }); // Debug logging

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

            // Only hide checkbox if cursor is not on it
            const cursorOnCheckbox = selection.from >= checkboxStart && selection.from <= checkboxEnd;
            
            if (!cursorOnCheckbox) {
                // Hide the markdown checkbox
                decorations.push(
                    Decoration.replace({
                        widget: new CheckboxWidget(checkbox.includes('x') || checkbox.includes('X')),
                        block: false,
                    }).range(checkboxStart, checkboxEnd),
                );
            }

            // Always hide the bullet (-, *, +) for task lists
            const cursorOnBullet = selection.from >= markerStart && selection.from <= markerStart + bullet.length;
            if (!cursorOnBullet) {
                decorations.push(
                    Decoration.replace({}).range(markerStart, markerStart + bullet.length),
                );
            }
        } else {
            // Regular list item
            const markerEnd = from + match[0].length;

            // Check if it's an unordered list (-, *, +)
            const isUnordered = ['-', '*', '+'].includes(bullet);

            if (isUnordered) {
                // Only replace bullet if cursor is not directly on it
                const cursorOnBullet = selection.from >= markerStart && selection.from <= markerStart + bullet.length;
                
                if (!cursorOnBullet) {
                    // Replace the bullet with a styled dot widget
                    decorations.push(
                        Decoration.replace({
                            widget: new BulletWidget(),
                            block: false,
                        }).range(markerStart, markerStart + bullet.length),
                    );
                }
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
        const bullet = document.createElement('span');
        bullet.className = 'cm-list-bullet';
        bullet.setAttribute('aria-hidden', 'true');
        bullet.textContent = '•'; // Fallback character in case CSS doesn't load
        return bullet;
    }

    eq(other: BulletWidget): boolean {
        return true;
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

    eq(other: CheckboxWidget): boolean {
        return other.checked === this.checked;
    }

    ignoreEvent() {
        return false;
    }
}
