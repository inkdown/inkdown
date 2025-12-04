/**
 * TauriDialog
 * 
 * Tauri implementation of IDialog
 */

import { invoke } from '@tauri-apps/api/core';
import type {
  IDialog,
  SaveDialogOptions,
  OpenDialogOptions,
  FolderDialogOptions,
  AlertOptions,
  ConfirmOptions,
  PromptOptions,
} from '@inkdown/core/native';

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
    // Use browser alert as fallback, or implement via Tauri dialog plugin
    window.alert(`${options.title}\n\n${options.message}`);
  }

  async confirm(options: ConfirmOptions): Promise<boolean> {
    // Use browser confirm as fallback
    return window.confirm(`${options.title}\n\n${options.message}`);
  }

  async prompt(options: PromptOptions): Promise<string | null> {
    // Use browser prompt as fallback
    return window.prompt(`${options.title}\n\n${options.message}`, options.defaultValue);
  }
}
