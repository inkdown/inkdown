/**
 * TauriDialog
 *
 * Tauri implementation of IDialog
 */

import type {
    AlertOptions,
    ConfirmOptions,
    FolderDialogOptions,
    IDialog,
    OpenDialogOptions,
    PromptOptions,
    SaveDialogOptions,
} from '@inkdown/core/native';
import { invoke } from '@tauri-apps/api/core';
import { ask, message } from '@tauri-apps/plugin-dialog';

interface TauriDialogOptions {
    title?: string;
    defaultPath?: string;
    defaultName?: string;
    filters?: Array<{ name: string; extensions: string[] }>;
}

export class TauriDialog implements IDialog {
    async showSaveDialog(options: SaveDialogOptions = {}): Promise<string | null> {
        const tauriOptions: TauriDialogOptions = {
            title: options.title,
            defaultPath: options.defaultPath,
            defaultName: options.defaultName,
            filters: options.filters,
        };
        return invoke<string | null>('show_save_dialog', { options: tauriOptions });
    }

    async showOpenFileDialog(options: OpenDialogOptions = {}): Promise<string | null> {
        const tauriOptions: TauriDialogOptions = {
            title: options.title,
            defaultPath: options.defaultPath,
            filters: options.filters,
        };
        return invoke<string | null>('show_open_file_dialog', { options: tauriOptions });
    }

    async showOpenFilesDialog(options: OpenDialogOptions = {}): Promise<string[]> {
        const tauriOptions: TauriDialogOptions = {
            title: options.title,
            defaultPath: options.defaultPath,
            filters: options.filters,
        };
        return invoke<string[]>('show_open_files_dialog', { options: tauriOptions });
    }

    async showOpenFolderDialog(options: FolderDialogOptions = {}): Promise<string | null> {
        const tauriOptions: TauriDialogOptions = {
            title: options.title,
            defaultPath: options.defaultPath,
        };
        return invoke<string | null>('show_open_folder_dialog', { options: tauriOptions });
    }

    async alert(options: AlertOptions): Promise<void> {
        await message(options.message, {
            title: options.title,
            kind: 'info',
        });
    }

    async confirm(options: ConfirmOptions): Promise<boolean> {
        return await ask(options.message, {
            title: options.title,
            kind: 'warning',
            okLabel: options.okLabel || 'OK',
            cancelLabel: options.cancelLabel || 'Cancel',
        });
    }

    async prompt(options: PromptOptions): Promise<string | null> {
        // Tauri doesn't have a built-in prompt dialog, use browser fallback
        return window.prompt(`${options.title}\n\n${options.message}`, options.defaultValue);
    }
}
