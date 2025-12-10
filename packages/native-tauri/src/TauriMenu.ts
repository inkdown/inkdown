/**
 * TauriMenu - Native Menu Implementation for Tauri v2
 *
 * Uses Tauri's native menu API to display context menus.
 * Provides a native look and feel on all desktop platforms.
 */

import type {
    CheckboxMenuItem,
    ContextMenuOptions,
    IMenu,
    MenuItem as MenuItemConfig,
    NormalMenuItem,
    SubmenuMenuItem,
} from '@inkdown/core/native';
import { LogicalPosition } from '@tauri-apps/api/dpi';
import { CheckMenuItem, Menu, MenuItem, PredefinedMenuItem } from '@tauri-apps/api/menu';

export class TauriMenu implements IMenu {
    // Track if a menu is currently being shown to prevent duplicate calls
    private isShowingMenu = false;

    /**
     * Show a native context menu at the specified position
     */
    async showContextMenu(options: ContextMenuOptions): Promise<void> {
        // Prevent multiple simultaneous menu creations
        if (this.isShowingMenu) {
            return;
        }

        this.isShowingMenu = true;

        try {
            const menuItems = await this.buildMenuItems(options.items);

            const menu = await Menu.new({
                items: menuItems,
            });

            // Show at position or at cursor
            if (options.position) {
                await menu.popup(new LogicalPosition(options.position.x, options.position.y));
            } else {
                await menu.popup();
            }
        } finally {
            this.isShowingMenu = false;
        }
    }

    /**
     * Check if native menus are supported
     */
    isSupported(): boolean {
        return true; // Always supported in Tauri
    }

    /**
     * Build Tauri menu items from our config format
     */
    private async buildMenuItems(items: MenuItemConfig[]): Promise<any[]> {
        const result: any[] = [];

        for (const item of items) {
            if (item.type === 'separator') {
                result.push(await PredefinedMenuItem.new({ item: 'Separator' }));
            } else if (item.type === 'checkbox') {
                result.push(await this.buildCheckMenuItem(item));
            } else if (item.type === 'submenu') {
                result.push(await this.buildSubmenu(item));
            } else {
                // Normal item
                result.push(await this.buildMenuItem(item as NormalMenuItem));
            }
        }

        return result;
    }

    /**
     * Build a normal menu item
     */
    private async buildMenuItem(item: NormalMenuItem): Promise<MenuItem> {
        return MenuItem.new({
            id: item.id,
            text: item.text,
            enabled: item.enabled !== false,
            accelerator: item.accelerator,
            action: item.action
                ? () => {
                      item.action?.();
                  }
                : undefined,
        });
    }

    /**
     * Build a checkbox menu item
     */
    private async buildCheckMenuItem(item: CheckboxMenuItem): Promise<CheckMenuItem> {
        return CheckMenuItem.new({
            id: item.id,
            text: item.text,
            enabled: item.enabled !== false,
            checked: item.checked,
            accelerator: item.accelerator,
            action: item.action
                ? () => {
                      item.action?.();
                  }
                : undefined,
        });
    }

    /**
     * Build a submenu
     */
    private async buildSubmenu(item: SubmenuMenuItem): Promise<any> {
        // Import Submenu dynamically to avoid circular deps
        const { Submenu } = await import('@tauri-apps/api/menu');

        const submenuItems = await this.buildMenuItems(item.items);

        return Submenu.new({
            id: item.id,
            text: item.text,
            enabled: item.enabled !== false,
            items: submenuItems,
        });
    }
}
