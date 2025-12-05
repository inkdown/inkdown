/**
 * IMenu - Native Menu Interface
 * 
 * Provides cross-platform native context menu support.
 * On desktop (Tauri), uses native OS menus.
 * On other platforms, can fall back to custom implementations.
 */

// ============================================================================
// Menu Item Types
// ============================================================================

export type MenuItemType = 'normal' | 'separator' | 'checkbox' | 'submenu';

export interface MenuItemBase {
    /** Unique identifier for the item */
    id: string;
    /** Display text */
    text: string;
    /** Whether the item is enabled */
    enabled?: boolean;
    /** Keyboard accelerator (e.g., "CmdOrCtrl+C") */
    accelerator?: string;
}

export interface NormalMenuItem extends MenuItemBase {
    type?: 'normal';
    /** Action handler when item is clicked */
    action?: () => void | Promise<void>;
}

export interface SeparatorMenuItem {
    type: 'separator';
}

export interface CheckboxMenuItem extends MenuItemBase {
    type: 'checkbox';
    /** Whether the checkbox is checked */
    checked: boolean;
    /** Action handler when item is clicked */
    action?: () => void | Promise<void>;
}

export interface SubmenuMenuItem extends MenuItemBase {
    type: 'submenu';
    /** Submenu items */
    items: MenuItem[];
}

export type MenuItem = 
    | NormalMenuItem 
    | SeparatorMenuItem 
    | CheckboxMenuItem 
    | SubmenuMenuItem;

// ============================================================================
// Menu Position
// ============================================================================

export interface MenuPosition {
    x: number;
    y: number;
}

// ============================================================================
// Menu Options
// ============================================================================

export interface ContextMenuOptions {
    /** Menu items */
    items: MenuItem[];
    /** Position to show the menu (if not provided, shows at cursor) */
    position?: MenuPosition;
}

// ============================================================================
// Menu Interface
// ============================================================================

export interface IMenu {
    /**
     * Show a context menu at the specified position
     * @param options Menu configuration
     * @returns Promise that resolves when menu is closed
     */
    showContextMenu(options: ContextMenuOptions): Promise<void>;
    
    /**
     * Check if native menus are supported
     */
    isSupported(): boolean;
}
