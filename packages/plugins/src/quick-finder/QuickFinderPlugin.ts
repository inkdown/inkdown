import { Plugin } from '@inkdown/core';
import { QuickFinderModal } from './QuickFinderModal';

/**
 * Quick Finder Plugin - Quick search and create notes
 *
 * Features:
 * - Fuzzy search by name and path
 * - Keyboard navigation
 * - Open in current or new tab
 * - Create notes with Shift+Enter
 */
export default class QuickFinderPlugin extends Plugin {
    private modal: QuickFinderModal | null = null;

    async onload(): Promise<void> {
        console.log('QuickFinderPlugin loaded');

        // Register command with Ctrl+O shortcut
        this.addCommand({
            id: 'quick-finder:open',
            name: 'Open Quick Finder',
            hotkey: ['Mod', 'o'],
            callback: () => {
                this.openQuickFinder();
            },
        });
    }

    async onunload(): Promise<void> {
        console.log('QuickFinderPlugin unloaded');

        // Close modal if open
        if (this.modal) {
            this.modal.close();
            this.modal = null;
        }
    }

    /**
     * Open the Quick Finder modal
     */
    private openQuickFinder(): void {
        // Create new modal if not exists
        if (!this.modal) {
            this.modal = new QuickFinderModal(this.app);
        }

        this.modal.open();
    }
}
