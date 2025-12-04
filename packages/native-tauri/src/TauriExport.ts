/**
 * TauriExport
 * 
 * Tauri implementation of IExport (cross-platform export API)
 */

import { invoke } from '@tauri-apps/api/core';
import type {
  IExport,
  ExportOptions,
  ExportResult,
  ImportOptions,
  ImportResult,
  ExportFeature,
} from '@inkdown/core/native';

export class TauriExport implements IExport {
  async saveFile(options: ExportOptions): Promise<ExportResult> {
    try {
      // Show save dialog
      const path = await invoke<string | null>('show_save_dialog', {
        options: {
          title: options.title || 'Save File',
          defaultName: options.filename,
        },
      });

      if (!path) {
        return { success: false };
      }

      // Write file
      if (typeof options.data === 'string') {
        await invoke('write_file', { path, content: options.data });
      } else {
        // Convert Uint8Array to base64
        let binary = '';
        for (let i = 0; i < options.data.length; i++) {
          binary += String.fromCharCode(options.data[i]);
        }
        const base64 = btoa(binary);
        await invoke('write_file_binary', { path, data: base64 });
      }

      return { success: true, path };
    } catch (error) {
      console.error('[TauriExport] saveFile error:', error);
      return { success: false };
    }
  }

  async pickFile(options: ImportOptions = {}): Promise<ImportResult | null> {
    try {
      const path = await invoke<string | null>('show_open_file_dialog', {
        options: {
          title: options.title || 'Open File',
          filters: options.extensions?.length
            ? [{ name: 'Files', extensions: options.extensions }]
            : undefined,
        },
      });

      if (!path) {
        return null;
      }

      // Read file content
      const content = await invoke<string>('read_file', { path });
      
      // Extract filename from path
      const name = path.split(/[\\/]/).pop() || 'file';

      return {
        name,
        data: content,
        path,
      };
    } catch (error) {
      console.error('[TauriExport] pickFile error:', error);
      return null;
    }
  }

  async pickFiles(options: ImportOptions = {}): Promise<ImportResult[]> {
    try {
      const paths = await invoke<string[]>('show_open_files_dialog', {
        options: {
          title: options.title || 'Open Files',
          filters: options.extensions?.length
            ? [{ name: 'Files', extensions: options.extensions }]
            : undefined,
        },
      });

      if (!paths || paths.length === 0) {
        return [];
      }

      // Read all files
      const results: ImportResult[] = [];
      for (const path of paths) {
        const content = await invoke<string>('read_file', { path });
        const name = path.split(/[\\/]/).pop() || 'file';
        results.push({ name, data: content, path });
      }

      return results;
    } catch (error) {
      console.error('[TauriExport] pickFiles error:', error);
      return [];
    }
  }

  supports(feature: ExportFeature): boolean {
    switch (feature) {
      case 'saveToPath':
        return true;
      case 'pickFolder':
        return true;
      case 'clipboard':
        return true;
      case 'print':
        return true;
      case 'share':
        return false; // Desktop doesn't have share sheet
      default:
        return false;
    }
  }
}
