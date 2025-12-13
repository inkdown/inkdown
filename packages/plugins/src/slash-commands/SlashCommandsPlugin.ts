import type {
    App,
    EditorPosition,
    EditorSuggestContext,
    EditorSuggestTriggerInfo,
    TFile,
} from '@inkdown/core';
import { EditorSuggest, Plugin, setIcon } from '@inkdown/core';
import { SlashCommandsSettingTab } from './SlashCommandsSettingTab';

interface SlashCommandsSettings {
    enableSlashCommands: boolean;
}

const DEFAULT_SETTINGS: SlashCommandsSettings = {
    enableSlashCommands: true,
};

interface SlashCommand {
    id: string;
    name: string;
    icon: string;
    description: string;
    action: (editor: any, cursor: EditorPosition) => void;
}

/**
 * Slash Command Suggestion
 */
class SlashCommandSuggest extends EditorSuggest<SlashCommand> {
    plugin: SlashCommandsPlugin;
    private commands: SlashCommand[];

    constructor(app: App, plugin: SlashCommandsPlugin) {
        super(app);
        this.plugin = plugin;
        this.commands = this.getCommands();
    }

    getCommands(): SlashCommand[] {
        return [
            {
                id: 'h1',
                name: 'Heading 1',
                icon: 'heading-1',
                description: 'Big section heading',
                action: (editor, cursor) => this.insertLinePrefix(editor, cursor, '# '),
            },
            {
                id: 'h2',
                name: 'Heading 2',
                icon: 'heading-2',
                description: 'Medium section heading',
                action: (editor, cursor) => this.insertLinePrefix(editor, cursor, '## '),
            },
            {
                id: 'h3',
                name: 'Heading 3',
                icon: 'heading-3',
                description: 'Small section heading',
                action: (editor, cursor) => this.insertLinePrefix(editor, cursor, '### '),
            },
            {
                id: 'bullet-list',
                name: 'Bullet List',
                icon: 'list',
                description: 'Create a simple bullet list',
                action: (editor, cursor) => this.insertLinePrefix(editor, cursor, '- '),
            },
            {
                id: 'numbered-list',
                name: 'Numbered List',
                icon: 'list-ordered',
                description: 'Create a numbered list',
                action: (editor, cursor) => this.insertLinePrefix(editor, cursor, '1. '),
            },
            {
                id: 'quote',
                name: 'Quote',
                icon: 'quote',
                description: 'Capture a quote',
                action: (editor, cursor) => this.insertLinePrefix(editor, cursor, '> '),
            },
            {
                id: 'code-block',
                name: 'Code Block',
                icon: 'code',
                description: 'Capture a code snippet',
                action: (editor, cursor) => {
                    const line = editor.state.doc.line(cursor.line + 1);
                    const from = line.from;
                    const to = line.to;
                    const replacement = '```\n\n```';

                    editor.dispatch({
                        changes: { from, to, insert: replacement },
                        selection: { anchor: from + 4 }, // Position cursor inside block
                    });
                },
            },
            {
                id: 'todo',
                name: 'To-do List',
                icon: 'check-square',
                description: 'Track tasks with a to-do list',
                action: (editor, cursor) => this.insertLinePrefix(editor, cursor, '- [ ] '),
            },
            {
                id: 'divider',
                name: 'Divider',
                icon: 'minus',
                description: 'Visually divide content',
                action: (editor, cursor) => {
                    const line = editor.state.doc.line(cursor.line + 1);
                    editor.dispatch({
                        changes: { from: line.from, to: line.to, insert: '---' },
                        selection: { anchor: line.from + 3 },
                    });
                },
            },
        ];
    }

    insertLinePrefix(editor: any, cursor: EditorPosition, prefix: string) {
        const line = editor.state.doc.line(cursor.line + 1);
        editor.dispatch({
            changes: { from: line.from, to: line.to, insert: prefix },
            selection: { anchor: line.from + prefix.length },
        });
    }

    onTrigger(
        cursor: EditorPosition,
        editor: any,
        _file: TFile | null,
    ): EditorSuggestTriggerInfo | null {
        if (!this.plugin.settings.enableSlashCommands) return null;

        const line = editor.state.doc.line(cursor.line + 1);
        const sub = line.text.substring(0, cursor.ch);

        // Trigger on "/" at start of line or after space
        // Also ensure it's the last character typed
        const match = sub.match(/(?:^|\s)\/$/);

        if (match) {
            return {
                start: { line: cursor.line, ch: match.index! + (match[0].startsWith(' ') ? 1 : 0) },
                end: cursor,
                query: '',
            };
        }

        // Also trigger if we are typing after /
        // e.g. "/hea"
        const matchWithQuery = sub.match(/(?:^|\s)\/([a-zA-Z0-9]*)$/);
        if (matchWithQuery) {
            return {
                start: {
                    line: cursor.line,
                    ch: matchWithQuery.index! + (matchWithQuery[0].startsWith(' ') ? 1 : 0),
                },
                end: cursor,
                query: matchWithQuery[1],
            };
        }

        return null;
    }

    getSuggestions(context: EditorSuggestContext): SlashCommand[] {
        const query = context.query.toLowerCase();
        return this.commands.filter(
            (cmd) => cmd.name.toLowerCase().includes(query) || cmd.id.toLowerCase().includes(query),
        );
    }

    renderSuggestion(cmd: SlashCommand, el: HTMLElement): void {
        el.addClass('slash-command-item');
        el.style.display = 'flex';
        el.style.alignItems = 'center';
        el.style.gap = '10px';
        el.style.padding = '6px 10px';

        // Icon
        const iconEl = el.createDiv({ cls: 'slash-command-icon' });
        setIcon(iconEl, cmd.icon);
        iconEl.style.display = 'flex';
        iconEl.style.alignItems = 'center';
        iconEl.style.justifyContent = 'center';

        // Content
        const contentEl = el.createDiv({ cls: 'slash-command-content' });
        contentEl.createDiv({ cls: 'slash-command-name', text: cmd.name }).style.fontWeight =
            'bold';
        contentEl.createDiv({ cls: 'slash-command-desc', text: cmd.description }).style.fontSize =
            '0.8em';
        contentEl
            .querySelector('.slash-command-desc')
            ?.setAttribute('style', 'color: var(--text-muted); font-size: 0.8em;');
    }

    selectSuggestion(cmd: SlashCommand, _evt: MouseEvent | KeyboardEvent): void {
        if (!this.context) return;
        const { editor, start } = this.context;

        // Execute action
        cmd.action(editor, start);
    }
}

export default class SlashCommandsPlugin extends Plugin {
    settings: SlashCommandsSettings = DEFAULT_SETTINGS;
    private slashSuggest: SlashCommandSuggest | null = null;

    async onload(): Promise<void> {
        console.log('SlashCommandsPlugin loaded');

        await this.loadSettings();

        // Register slash command suggester
        this.slashSuggest = new SlashCommandSuggest(this.app, this);
        this.registerEditorSuggest(this.slashSuggest);

        // Add settings tab
        this.addSettingTab(new SlashCommandsSettingTab(this.app, this));

        this.addCommand({
            id: 'slash-commands',
            name: 'teste',
            hotkey: ['Mod', 'ç'],
            callback: async () => {
                const resultado = await this.app.fileManager.createFile(
                    '/home/furqas/Documentos/inkdown/test.md',
                    '# Meu teste',
                );

                console.log(resultado);
            },
        });
    }

    async onunload(): Promise<void> {
        console.log('SlashCommandsPlugin unloaded');
        if (this.slashSuggest) {
            this.app.unregisterEditorSuggest(this.slashSuggest);
        }
    }

    // ... (rest of the file)

    async loadSettings(): Promise<void> {
        this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    }

    async saveSettings(): Promise<void> {
        await this.saveData(this.settings);
    }
}
