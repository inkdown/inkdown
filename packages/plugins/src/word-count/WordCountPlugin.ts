import { EditorAdapter, Plugin, setIcon } from '@inkdown/core';
import { WordCountSettingTab } from './WordCountSettingTab';

export interface WordCountSettings {
    showCharCount: boolean;
    showWordCount: boolean;
    countSpaces: boolean;
}

const DEFAULT_SETTINGS: WordCountSettings = {
    showCharCount: false,
    showWordCount: true,
    countSpaces: false,
};

/**
 * Word Count Plugin - Displays word and character count in the status bar
 *
 * - Settings using loadData/saveData
 * - PluginSettingTab for settings UI
 * - Status bar integration
 * - Lifecycle management (onload/onunload)
 */
export default class WordCountPlugin extends Plugin {
    settings: WordCountSettings = DEFAULT_SETTINGS;
    private statusBarItem: HTMLElement | null = null;
    private updateInterval: number | null = null;

    async onload(): Promise<void> {
        console.log('WordCountPlugin loaded');

        // Load settings using the Plugin API
        await this.loadSettings();

        // Create status bar item
        await this.createStatusBarItem();

        // Register settings tab using the new PluginSettingTab class
        this.addSettingTab(new WordCountSettingTab(this.app, this));

        // Start updating word count
        this.startUpdating();
    }

    async onunload(): Promise<void> {
        console.log('WordCountPlugin unloaded');

        // Stop updating
        this.stopUpdating();

        // Note: statusBarItem cleanup is handled automatically by Plugin._cleanup()
    }

    /**
     * Load plugin settings using the Plugin API
     */
    async loadSettings(): Promise<void> {
        const data = await this.loadData<WordCountSettings>();
        this.settings = { ...DEFAULT_SETTINGS, ...data };
    }

    /**
     * Save plugin settings using the Plugin API
     */
    async saveSettings(): Promise<void> {
        await this.saveData(this.settings);
        // Update display after settings change
        this.updateWordCount();
    }

    /**
     * Create the status bar item using the Plugin API
     */
    private async createStatusBarItem(): Promise<void> {
        // Use the Plugin API - it handles attachment automatically
        this.statusBarItem = this.addStatusBarItem();

        // Apply custom styling
        this.statusBarItem.addClass('word-count-status');
        this.statusBarItem.style.display = 'flex';
        this.statusBarItem.style.alignItems = 'center';
        this.statusBarItem.style.gap = '8px';

        // Wait for icon to be created before setting text
        await setIcon(this.statusBarItem, 'folder-heart');

        // Initial update
        this.updateWordCount();
    }

    /**
     * Start updating word count periodically
     */
    private startUpdating(): void {
        // Update every 500ms
        this.updateInterval = window.setInterval(() => {
            this.updateWordCount();
        }, 500);
    }

    /**
     * Stop updating word count
     */
    private stopUpdating(): void {
        if (this.updateInterval !== null) {
            window.clearInterval(this.updateInterval);
            this.updateInterval = null;
        }
    }

    /**
     * Update the word count display
     */
    private updateWordCount(): void {
        if (!this.statusBarItem) return;

        // Get the active editor using EditorAdapter
        const activeEditor = this.app.editorRegistry.getActive();
        if (!activeEditor) {
            this.statusBarItem.textContent = '';
            return;
        }

        // Use EditorAdapter to abstract away CodeMirror
        const editorAdapter = new EditorAdapter(activeEditor);
        const content = editorAdapter.getValue();

        // Calculate word count
        const wordCount = this.countWords(content);
        const charCount = this.countCharacters(content);

        // Build display text
        const parts: string[] = [];

        if (this.settings.showWordCount) {
            parts.push(`${wordCount} ${wordCount === 1 ? 'word' : 'words'}`);
        }

        if (this.settings.showCharCount) {
            parts.push(`${charCount} ${charCount === 1 ? 'char' : 'chars'}`);
        }

        this.statusBarItem.setText(parts.join(' • '));
    }

    /**
     * Count words in text
     */
    private countWords(text: string): number {
        if (!text || text.trim().length === 0) return 0;

        // Remove markdown syntax for more accurate count
        const cleanText = text
            .replace(/```[\s\S]*?```/g, '') // Remove code blocks
            .replace(/`[^`]+`/g, '') // Remove inline code
            .replace(/!\[.*?\]\(.*?\)/g, '') // Remove images
            .replace(/\[.*?\]\(.*?\)/g, '$1') // Remove links but keep text
            .replace(/[#*_~`]/g, '') // Remove markdown formatting
            .trim();

        // Split by whitespace and filter empty strings
        const words = cleanText.split(/\s+/).filter((word) => word.length > 0);
        return words.length;
    }

    /**
     * Count characters in text
     */
    private countCharacters(text: string): number {
        if (!text) return 0;

        if (this.settings.countSpaces) {
            return text.length;
        }
        return text.replace(/\s/g, '').length;
    }
}
