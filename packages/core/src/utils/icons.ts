/**
 * Icon utilities for Inkdown plugins
 * Provides functions for working with icons
 */

/**
 * Registry of custom icons
 */
const iconRegistry = new Map<string, string>();

/**
 * Set an icon on an HTML element using Lucide React
 *
 * The icon will be added as a sibling element before the existing content,
 * not replacing it.
 *
 * @param element The element to add the icon to
 * @param iconId The Lucide icon name (e.g., 'book', 'file-text', 'settings')
 * @returns Promise that resolves when the icon is created
 *
 * @example
 * ```ts
 * const statusBarItem = this.addStatusBarItem();
 * await setIcon(statusBarItem, 'book'); // Wait for icon to be created
 * statusBarItem.setText('Word count: 100'); // Now set text - icon will be preserved
 * ```
 */
export async function setIcon(element: HTMLElement, iconId: string): Promise<void> {
    // Add class immediately
    element.addClass('has-icon');

    // Remove any existing icon
    const existingIcon = element.querySelector('.lucide-icon');
    if (existingIcon) {
        existingIcon.remove();
    }

    // Check if it's a custom registered icon
    const customIcon = iconRegistry.get(iconId);
    if (customIcon) {
        const iconContainer = document.createSpan({ cls: 'lucide-icon custom-icon' });
        iconContainer.innerHTML = customIcon;
        element.prepend(iconContainer);
        return;
    }

    // For Lucide icons, we need to use dynamic import
    // This will be handled by creating an SVG element with the Lucide icon
    await createLucideIcon(element, iconId);
}

/**
 * Create a Lucide icon element
 * Uses dynamic import to load the icon component
 */
async function createLucideIcon(element: HTMLElement, iconName: string): Promise<void> {
    console.log(`[setIcon] Creating icon: ${iconName}`);

    try {
        // Convert kebab-case to PascalCase (e.g., 'file-text' -> 'FileText')
        const pascalCase = iconName
            .split('-')
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join('');

        console.log(`[setIcon] Loading icon component: ${pascalCase}`);

        // Dynamically import the icon from lucide-react
        const iconModule = await import('lucide-react');
        const IconComponent = (iconModule as any)[pascalCase];

        if (!IconComponent) {
            console.warn(`Icon "${iconName}" not found in lucide-react`);
            // Fallback to text
            const iconContainer = document.createSpan({ cls: 'lucide-icon fallback-icon' });
            iconContainer.setText(iconName);
            element.prepend(iconContainer);
            return;
        }

        console.log('[setIcon] Icon component loaded, creating container');

        // Create a container for the icon
        const iconContainer = document.createSpan({ cls: 'lucide-icon' });
        element.prepend(iconContainer);

        console.log('[setIcon] Rendering React icon component');

        // Render the React component to the container
        const React = await import('react');
        const ReactDOM = await import('react-dom/client');

        const iconElement = React.createElement(IconComponent, {
            size: 16,
            strokeWidth: 2,
        });

        const root = ReactDOM.createRoot(iconContainer);
        root.render(iconElement);

        console.log(`[setIcon] Icon "${iconName}" rendered successfully`);
    } catch (error: any) {
        console.error(`Failed to load icon "${iconName}":`, error);
        // Fallback to text
        const iconContainer = document.createSpan({ cls: 'lucide-icon fallback-icon' });
        iconContainer.setText(iconName);
        element.prepend(iconContainer);
    }
}
