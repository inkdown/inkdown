/**
 * TauriFileSystem
 *
 * Tauri implementation of IFileSystem
 */

import type { FileNode, IFileSystem } from '@inkdown/core/native';
import { invoke } from '@tauri-apps/api/core';

interface TauriFileNode {
    name: string;
    path: string;
    is_directory: boolean;
    children?: TauriFileNode[];
    size?: number;
    modified?: number;
}

function convertFileNode(node: TauriFileNode): FileNode {
    return {
        name: node.name,
        path: node.path,
        isDirectory: node.is_directory,
        children: node.children?.map(convertFileNode),
        size: node.size,
        modified: node.modified,
    };
}

export class TauriFileSystem implements IFileSystem {
    async readFile(path: string): Promise<string> {
        return invoke<string>('read_file', { path });
    }

    async readFileBinary(path: string): Promise<Uint8Array> {
        const base64 = await invoke<string>('read_file_binary', { path });
        const binary = atob(base64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
            bytes[i] = binary.charCodeAt(i);
        }
        return bytes;
    }

    async readDirectory(path: string, recursive = false): Promise<FileNode[]> {
        const nodes = await invoke<TauriFileNode[]>('read_directory', { path, recursive });
        return nodes.map(convertFileNode);
    }

    async exists(path: string): Promise<boolean> {
        return invoke<boolean>('path_exists', { path });
    }

    async writeFile(path: string, content: string): Promise<void> {
        await invoke('write_file', { path, content });
    }

    async writeFileBinary(path: string, data: Uint8Array): Promise<void> {
        // Convert to base64
        let binary = '';
        for (const byte of data) {
            binary += String.fromCharCode(byte);
        }
        const base64 = btoa(binary);
        await invoke('write_file_binary', { path, data: base64 });
    }

    async createDirectory(path: string): Promise<void> {
        await invoke('create_directory', { path });
    }

    async rename(oldPath: string, newPath: string): Promise<void> {
        await invoke('rename_path', { oldPath, newPath });
    }

    async delete(path: string): Promise<void> {
        await invoke('delete_path', { path });
    }

    async move(source: string, destination: string): Promise<void> {
        await invoke('move_path', { source, destination });
    }

    async copy(source: string, destination: string): Promise<void> {
        await invoke('copy_file', { source, destination });
    }

    // ============================================================================
    // Plugin File Operations
    // ============================================================================

    async readPluginFile(pluginId: string, fileName: string): Promise<string> {
        return invoke<string>('read_plugin_file', { pluginId, fileName });
    }

    async writePluginFile(pluginId: string, fileName: string, content: string): Promise<void> {
        await invoke('write_plugin_file', { pluginId, fileName, content });
    }

    async deletePluginDir(pluginId: string): Promise<void> {
        await invoke('delete_plugin_dir', { pluginId });
    }

    async ensureDir(path: string): Promise<void> {
        await invoke('ensure_dir', { path });
    }

    // ============================================================================
    // Theme File Operations
    // ============================================================================

    async listCustomThemes(): Promise<string[]> {
        return invoke<string[]>('list_custom_themes');
    }

    async readThemeManifest(themeName: string): Promise<string> {
        return invoke<string>('read_theme_manifest', { themeName });
    }

    async readThemeCss(themeName: string, cssFile: string): Promise<string> {
        return invoke<string>('read_theme_css', { themeName, cssFile });
    }

    async installCommunityThemeFile(
        themeName: string,
        fileName: string,
        content: string,
    ): Promise<void> {
        await invoke('install_community_theme_file', { themeName, fileName, content });
    }

    async uninstallCommunityTheme(themeName: string): Promise<void> {
        await invoke('uninstall_community_theme', { themeName });
    }
}
