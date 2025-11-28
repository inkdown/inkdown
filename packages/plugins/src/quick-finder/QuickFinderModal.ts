import type { TFile } from '@inkdown/core';
import { FuzzySuggestModal, type App, Notice } from '@inkdown/core';
import './QuickFinderModal.css';

/**
 * Quick Finder Modal - Search and create notes interface
 * 
 * Uses FuzzySuggestModal for fuzzy search with keyboard navigation
 * Shows 10 most recently opened files at the top (from Workspace API)
 */
export class QuickFinderModal extends FuzzySuggestModal<TFile> {
    private workspacePath = '';
    private footerEl: HTMLElement | null = null;

    constructor(app: App) {
        super(app);
        this.setLimit(50);
    }

    async onOpen() {
        // Get workspace path
        const config = await this.app.configManager.loadConfig<{ workspace?: string }>('app');
        this.workspacePath = config?.workspace || '';

        if (!this.workspacePath) {
            this.contentEl.empty();
            this.contentEl.addClass('quick-finder-modal');
            this.contentEl.createDiv('quick-finder-error').textContent = 'No workspace opened';
            return;
        }

        // Call parent onOpen to setup input and results
        super.onOpen();

        // Add custom class for styling
        this.contentEl.addClass('quick-finder-modal');

        // Update placeholder
        const inputEl = this.contentEl.querySelector('.fuzzy-suggest-input') as HTMLInputElement;
        if (inputEl) {
            inputEl.placeholder = 'Find or create a note...';

            // Add custom keyboard handler for Shift+Enter (create note)
            inputEl.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' && e.shiftKey) {
                    e.preventDefault();
                    e.stopPropagation();
                    this.createNote(inputEl.value);
                }
            });
        }

        // Add footer with keyboard hints (only if not already created)
        if (!this.footerEl) {
            this.createFooter();
        }
    }

    /**
     * Get all markdown files from workspace
     * Prioritizes recently opened files from Workspace API
     */
    async getItems(): Promise<TFile[]> {
        const allFiles = await this.app.workspace.getMarkdownFiles();

        // Get recent files from Workspace API
        const recentFilePaths = this.app.workspace.getRecentFiles();

        if (recentFilePaths.length === 0) {
            return allFiles;
        }

        // Separate files into recent and others
        const recentFileObjs: TFile[] = [];
        const otherFiles: TFile[] = [];

        for (const file of allFiles) {
            if (recentFilePaths.includes(file.path)) {
                recentFileObjs.push(file);
            } else {
                otherFiles.push(file);
            }
        }

        // Sort recent files by their order in recentFiles array
        recentFileObjs.sort((a, b) => {
            const indexA = recentFilePaths.indexOf(a.path);
            const indexB = recentFilePaths.indexOf(b.path);
            return indexA - indexB;
        });

        // Return recent files first, then others
        return [...recentFileObjs, ...otherFiles];
    }

    /**
     * Get the display text for a file (relative path without .md extension)
     */
    getItemText(file: TFile): string {
        // Get relative path from workspace root
        const relativePath = this.app.workspace.getRelativePath(file.path);
        if (relativePath) {
            return relativePath.replace(/\.md$/, '');
        }
        // Fallback to full path if not in workspace
        return file.path.replace(/\.md$/, '');
    }

    /**
     * Handle file selection
     * Recent files tracking is handled automatically by WorkspaceUI
     */
    async onChooseItem(file: TFile, evt: MouseEvent | KeyboardEvent): Promise<void> {
        const openInNewTab = (evt instanceof KeyboardEvent && (evt.ctrlKey || evt.metaKey)) ||
            (evt instanceof MouseEvent && (evt.ctrlKey || evt.metaKey));

        try {
            // WorkspaceUI.openFile() will automatically add to recent files
            await this.app.workspaceUI.openFile(file, openInNewTab);
        } catch (error) {
            console.error('Failed to open note:', error);
            new Notice('Failed to open note');
        }
    }

    /**
     * Custom rendering to show relative path
     */
    renderSuggestion(value: { item: TFile }, el: HTMLElement): void {
        const displayPath = this.getItemText(value.item);
        el.setText(displayPath);
        el.addClass('quick-finder-item');
    }

    /**
     * Create footer with keyboard hints
     */
    private createFooter() {
        // Create footer element
        this.footerEl = document.createElement('div');
        this.footerEl.className = 'quick-finder-footer';

        const hints = [
            { icon: '↑↓', text: 'to navigate' },
            { icon: '↵', text: 'to open' },
            { icon: 'ctrl ↵', text: 'to open in new tab' },
            { icon: 'shift ↵', text: 'to create' },
            { icon: 'esc', text: 'to dismiss' },
        ];

        hints.forEach((hint) => {
            const hintEl = document.createElement('div');
            hintEl.className = 'quick-finder-hint';

            const keyEl = document.createElement('span');
            keyEl.className = 'quick-finder-hint-key';
            keyEl.textContent = hint.icon;

            const textEl = document.createElement('span');
            textEl.className = 'quick-finder-hint-text';
            textEl.textContent = hint.text;

            hintEl.appendChild(keyEl);
            hintEl.appendChild(textEl);
            this.footerEl!.appendChild(hintEl);
        });

        // Append to modal container (not content)
        this.containerEl.appendChild(this.footerEl);
    }

    /**
     * Create a new note with the given path
     * Recent files tracking is handled automatically when file is opened
     */
    private async createNote(inputValue: string) {
        const value = inputValue.trim();
        if (!value) return;

        try {
            // Clean up path
            let relativePath = value;
            if (relativePath.startsWith('/')) {
                relativePath = relativePath.substring(1);
            }

            // Build full path
            const fullPath = this.app.fileSystemManager.joinPath(this.workspacePath, relativePath);

            // Add .md extension if not present
            const notePath = fullPath.endsWith('.md') ? fullPath : fullPath + '.md';

            // Create parent directories if they don't exist
            const parentDir = this.app.fileSystemManager.getParentPath(notePath);
            if (parentDir && parentDir !== this.workspacePath) {
                try {
                    // Check if directory exists first
                    const exists = await this.app.fileSystemManager.exists(parentDir);
                    if (!exists) {
                        await this.app.fileSystemManager.createDirectory(parentDir);
                    }
                } catch (dirError) {
                    // If error checking/creating directory, log but continue
                    console.warn('Directory creation warning:', dirError);
                }
            }

            // Create file
            await this.app.fileSystemManager.writeFile(notePath, '');

            // TabManager.openTab() will trigger recent files via WorkspaceUI
            await this.app.tabManager.openTab(notePath, { openInNewTab: true });

            this.close();
        } catch (error) {
            console.error('Failed to create note:', error);
            new Notice('Failed to create note: ' + error);
        }
    }

    onClose() {
        // Remove footer if it exists
        if (this.footerEl && this.footerEl.parentNode) {
            this.footerEl.parentNode.removeChild(this.footerEl);
            this.footerEl = null;
        }
        super.onClose();
    }
}
