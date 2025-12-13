import { type App, Modal } from '@inkdown/core';

export class MoveToModal extends Modal {
    private sourcePath: string;
    private rootPath: string;
    private directories: string[];
    private onSubmit: (destination: string) => void;
    private selectedPath: string | null = null;

    constructor(
        app: App,
        sourcePath: string,
        rootPath: string,
        directories: string[],
        onSubmit: (destination: string) => void,
    ) {
        super(app);
        this.sourcePath = sourcePath;
        this.rootPath = rootPath;
        this.directories = directories;
        this.onSubmit = onSubmit;
        this.setTitle('Move Note To...');
    }

    onOpen() {
        const { contentEl, containerEl } = this;
        contentEl.empty();

        // Resize the modal window itself
        containerEl.style.width = '700px';
        containerEl.style.height = '600px';
        containerEl.style.maxWidth = '90vw';
        containerEl.style.maxHeight = '90vh';

        // Get current directory of the source file
        const currentDir = this.sourcePath.substring(0, this.sourcePath.lastIndexOf('/'));

        // Ensure contentEl takes full height and uses flexbox
        contentEl.style.display = 'flex';
        contentEl.style.flexDirection = 'column';
        contentEl.style.height = '100%';
        contentEl.style.padding = '0'; // Reset padding to handle it in container

        // Create container
        const container = contentEl.createDiv();
        container.style.display = 'flex';
        container.style.flexDirection = 'column';
        container.style.gap = '12px';
        container.style.padding = '20px'; // Restore padding here
        container.style.height = '100%'; // Fill the content area
        container.style.width = '100%';

        // Info text
        const infoText = container.createDiv('move-to-info');
        infoText.textContent = 'Select destination folder:';
        infoText.style.fontSize = '13px';
        infoText.style.color = 'var(--text-muted)';
        infoText.style.marginBottom = '4px';

        // Directory list container
        const listContainer = container.createDiv();
        listContainer.style.flex = '1'; // Take remaining height
        listContainer.style.overflowY = 'auto';
        listContainer.style.overflowX = 'hidden'; // Prevent horizontal scroll
        // Removed border and background as requested
        // listContainer.style.border = '1px solid var(--border-color)';
        // listContainer.style.borderRadius = '4px';
        // listContainer.style.background = 'var(--bg-primary)';

        // Add workspace root option
        const rootOption = this.createDirectoryOption(
            listContainer,
            this.rootPath,
            '/',
            currentDir === this.rootPath,
        );
        if (currentDir !== this.rootPath) {
            rootOption.addEventListener('click', () => this.selectDirectory(this.rootPath));
        }

        // Add all subdirectories
        const sortedDirs = [...this.directories].sort((a, b) => {
            // Sort by depth first (fewer slashes = higher up), then alphabetically
            // const depthA = (a.match(/\//g) || []).length;
            // const depthB = (b.match(/\//g) || []).length;
            // if (depthA !== depthB) return depthA - depthB;
            return a.localeCompare(b);
        });

        for (const dir of sortedDirs) {
            // Don't show the source file's current directory or any subdirectories of the source
            if (dir === currentDir) continue;
            if (this.sourcePath.startsWith(`${dir}/`)) continue;

            // Prevent moving a directory into itself or its children
            if (dir === this.sourcePath) continue;
            if (dir.startsWith(`${this.sourcePath}/`)) continue;

            const isCurrent = dir === currentDir;
            const displayName = this.getDisplayName(dir);

            const option = this.createDirectoryOption(listContainer, dir, displayName, isCurrent);
            if (!isCurrent) {
                option.addEventListener('click', () => this.selectDirectory(dir));
            }
        }

        // Buttons
        const buttonContainer = container.createDiv();
        buttonContainer.style.display = 'flex';
        buttonContainer.style.justifyContent = 'flex-end';
        buttonContainer.style.gap = '8px';
        buttonContainer.style.marginTop = 'auto'; // Push to bottom

        const cancelBtn = buttonContainer.createEl('button', { cls: 'mod-cancel' });
        cancelBtn.textContent = 'Cancel';
        cancelBtn.style.padding = '6px 12px';
        cancelBtn.style.borderRadius = '4px';
        cancelBtn.style.border = '1px solid var(--border-color)';
        cancelBtn.style.background = 'transparent';
        cancelBtn.style.color = 'var(--text-primary)';
        cancelBtn.style.cursor = 'pointer';
        cancelBtn.addEventListener('click', () => this.close());

        const moveBtn = buttonContainer.createEl('button', { cls: 'mod-cta' });
        moveBtn.textContent = 'Move Here';
        moveBtn.style.padding = '6px 12px';
        moveBtn.style.borderRadius = '4px';
        moveBtn.style.border = 'none';
        moveBtn.style.background = 'var(--color-primary)';
        moveBtn.style.color = 'white';
        moveBtn.style.cursor = 'pointer';
        moveBtn.disabled = !this.selectedPath;
        if (!this.selectedPath) {
            moveBtn.style.opacity = '0.5';
            moveBtn.style.cursor = 'not-allowed';
        }
        moveBtn.addEventListener('click', () => this.submit());
    }

    private createDirectoryOption(
        container: HTMLElement,
        path: string,
        displayName: string,
        isCurrent: boolean,
    ): HTMLElement {
        const option = container.createDiv();
        option.style.padding = '8px 12px';
        option.style.cursor = isCurrent ? 'default' : 'pointer';
        // Removed border bottom as requested
        // option.style.borderBottom = '1px solid var(--border-color)';
        option.style.display = 'flex';
        option.style.alignItems = 'center';
        option.style.gap = '8px';
        option.style.borderRadius = '4px'; // Added rounded corners for hover effect
        // Removed indentation since we show full path
        // option.style.paddingLeft = `${12 + depth * 16}px`;

        if (!isCurrent) {
            option.style.transition = 'background-color 0.2s';
            option.addEventListener('mouseenter', () => {
                option.style.backgroundColor = 'var(--bg-secondary-alt)'; // Use a distinct hover color
                // Fallback if variable doesn't exist, use a slightly darker/lighter shade depending on theme
                if (
                    !getComputedStyle(document.documentElement).getPropertyValue(
                        '--bg-secondary-alt',
                    )
                ) {
                    option.style.backgroundColor = 'rgba(128, 128, 128, 0.1)';
                }
            });
            option.addEventListener('mouseleave', () => {
                if (this.selectedPath !== path) {
                    option.style.backgroundColor = 'transparent';
                }
            });
        }

        if (isCurrent) {
            option.style.backgroundColor = 'var(--bg-secondary)';
            option.style.color = 'var(--text-primary)';
            option.style.opacity = '0.6';
        }

        // Removed Icon as requested
        // const icon = option.createSpan('move-to-icon');
        // icon.textContent = '📁';
        // icon.style.fontSize = '16px';

        // Name
        const name = option.createSpan('move-to-name');
        name.textContent = displayName;
        name.style.flex = '1';
        name.style.fontSize = '14px';
        name.style.fontFamily = 'monospace'; // Optional: make path look more like code/path
        // Truncate long paths
        name.style.whiteSpace = 'nowrap';
        name.style.overflow = 'hidden';
        name.style.textOverflow = 'ellipsis';

        // Current indicator
        if (isCurrent) {
            const badge = option.createSpan('move-to-current-badge');
            badge.textContent = 'Current';
            badge.style.fontSize = '10px';
            badge.style.padding = '2px 6px';
            badge.style.borderRadius = '3px';
            badge.style.background = 'var(--text-muted)';
            badge.style.color = 'var(--bg-primary)';
        }

        return option;
    }

    private selectDirectory(path: string) {
        this.selectedPath = path;

        // Update UI to show selection
        const options = this.contentEl.querySelectorAll('.move-to-option');
        options.forEach((opt) => {
            const htmlOpt = opt as HTMLElement;
            if (htmlOpt.textContent?.includes('Current')) return;

            htmlOpt.style.backgroundColor = 'transparent';
            htmlOpt.style.fontWeight = 'normal';
        });

        // Find and highlight selected option
        options.forEach((opt) => {
            const htmlOpt = opt as HTMLElement;
            const nameSpan = htmlOpt.querySelector('.move-to-name') as HTMLElement;
            if (
                nameSpan &&
                (nameSpan.textContent === this.getDisplayName(path) ||
                    (path === this.rootPath && nameSpan.textContent === '/'))
            ) {
                htmlOpt.style.backgroundColor = 'var(--color-primary-alpha)';
                htmlOpt.style.fontWeight = '500';
            }
        });

        // Enable move button
        const moveBtn = this.contentEl.querySelector('.mod-cta') as HTMLButtonElement;
        if (moveBtn) {
            moveBtn.disabled = false;
            moveBtn.style.opacity = '1';
            moveBtn.style.cursor = 'pointer';
        }
    }

    private getDisplayName(path: string): string {
        if (path === this.rootPath) return '/';

        // Get relative path from root and prepend /
        const relativePath = path.replace(this.rootPath, '');
        return relativePath;
    }

    private submit() {
        if (!this.selectedPath) return;

        this.onSubmit(this.selectedPath);
        this.close();
    }

    onClose() {
        this.contentEl.empty();
    }
}
