import { type App, Modal } from '@inkdown/core';

export class RenameModal extends Modal {
    private currentName: string;
    private onSubmit: (newName: string) => void;
    private inputEl: HTMLInputElement | null = null;

    constructor(app: App, currentName: string, onSubmit: (newName: string) => void) {
        super(app);
        this.currentName = currentName;
        this.onSubmit = onSubmit;
        this.setTitle('Rename Note');
    }

    onOpen() {
        const { contentEl } = this;
        contentEl.empty();

        // Parse filename
        const lastDotIndex = this.currentName.lastIndexOf('.');
        let nameWithoutExt = this.currentName;
        let extension = '';

        if (lastDotIndex > 0) {
            nameWithoutExt = this.currentName.substring(0, lastDotIndex);
            extension = this.currentName.substring(lastDotIndex);
        } else {
            // No extension or dot at start (hidden file)
            extension = '';
        }

        // If it's a markdown file, we definitely hide the extension
        // If it's another file, we also hide it per user request "não mostre a extensão na renomeação"
        // and preserve the original extension on submit.

        // Create container for input
        const container = contentEl.createDiv();
        container.style.display = 'flex';
        container.style.flexDirection = 'column';
        container.style.gap = '16px';
        container.style.padding = '8px 0';

        // Input field
        const inputContainer = container.createDiv();

        // Label if not markdown
        if (extension && extension !== '.md') {
            const label = inputContainer.createDiv('rename-extension-label');
            label.textContent = `File type: ${extension}`;
            label.style.fontSize = '12px';
            label.style.color = 'var(--text-muted)';
            label.style.marginBottom = '4px';
        }

        this.inputEl = inputContainer.createEl('input', {
            type: 'text',
            value: nameWithoutExt,
            cls: 'rename-input',
        });

        // Style input
        this.inputEl.style.width = '100%';
        this.inputEl.style.padding = '8px 12px';
        this.inputEl.style.borderRadius = '4px';
        this.inputEl.style.border = '1px solid var(--border-color)';
        this.inputEl.style.background = 'var(--bg-primary)';
        this.inputEl.style.color = 'var(--text-primary)';
        this.inputEl.style.fontSize = '14px';

        // Select all text
        this.inputEl.addEventListener('focus', () => {
            this.inputEl?.select();
        });

        // Handle Enter key
        this.inputEl.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                this.submit(extension);
            }
        });

        // Buttons
        const buttonContainer = container.createDiv();
        buttonContainer.style.display = 'flex';
        buttonContainer.style.justifyContent = 'flex-end';
        buttonContainer.style.gap = '8px';
        buttonContainer.style.marginTop = '8px';

        const cancelBtn = buttonContainer.createEl('button', { cls: 'mod-cancel' });
        cancelBtn.textContent = 'Cancel';
        cancelBtn.style.padding = '6px 12px';
        cancelBtn.style.borderRadius = '4px';
        cancelBtn.style.border = '1px solid var(--border-color)';
        cancelBtn.style.background = 'transparent';
        cancelBtn.style.color = 'var(--text-primary)';
        cancelBtn.style.cursor = 'pointer';
        cancelBtn.addEventListener('click', () => this.close());

        const confirmBtn = buttonContainer.createEl('button', { cls: 'mod-cta' });
        confirmBtn.textContent = 'Rename';
        confirmBtn.style.padding = '6px 12px';
        confirmBtn.style.borderRadius = '4px';
        confirmBtn.style.border = 'none';
        confirmBtn.style.background = 'var(--color-primary)';
        confirmBtn.style.color = 'white';
        confirmBtn.style.cursor = 'pointer';
        confirmBtn.addEventListener('click', () => this.submit(extension));

        // Focus input
        setTimeout(() => this.inputEl?.focus(), 50);
    }

    private submit(extension: string) {
        const newNamePart = this.inputEl?.value.trim();
        if (!newNamePart) return;

        // Re-attach extension
        // If original had no extension, and user didn't add one, we might want to default to .md?
        // But the requirement says "só possibilite a criação de arquivos markdown".
        // For renaming, we should probably preserve original extension.
        // If original was .md, extension is .md.

        let finalName = newNamePart;
        if (extension) {
            finalName += extension;
        } else if (!extension && !finalName.endsWith('.md')) {
            // If it had no extension, force .md?
            // User said "só possibilite a criação de arquivos markdown".
            // Let's assume if no extension, it becomes .md
            finalName += '.md';
        }

        if (finalName !== this.currentName) {
            this.onSubmit(finalName);
            this.close();
        } else {
            this.close();
        }
    }

    onClose() {
        this.contentEl.empty();
    }
}
