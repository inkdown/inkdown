/**
 * TauriAsset
 * 
 * Utilities for handling local file assets in Tauri
 */

import { invoke } from '@tauri-apps/api/core';

export class TauriAsset {
  /**
   * Convert a local file path to a URL that can be used in img src
   * For Tauri, we need to read the file and convert to data URL
   */
  static async convertFileToDataUrl(filePath: string): Promise<string> {
    try {
      console.log('[TauriAsset] Converting file to data URL:', filePath);
      
      // Read file as base64
      const base64 = await invoke<string>('read_file_binary', { path: filePath });
      console.log('[TauriAsset] Read file, base64 length:', base64.length);
      
      // Detect mime type from extension
      const mimeType = this.getMimeType(filePath);
      console.log('[TauriAsset] Detected mime type:', mimeType);
      
      // Return data URL
      const dataUrl = `data:${mimeType};base64,${base64}`;
      console.log('[TauriAsset] Data URL created successfully');
      return dataUrl;
    } catch (error) {
      console.error('[TauriAsset] Failed to convert file to data URL:', error);
      throw error;
    }
  }

  /**
   * Resolve a relative image path based on the current file path
   */
  static resolveImagePath(imagePath: string, currentFilePath: string | undefined): string {
    console.log('[TauriAsset] Resolving image path:', { imagePath, currentFilePath });
    
    // If it's an absolute path or URL, return as is
    if (imagePath.startsWith('http://') || 
        imagePath.startsWith('https://') || 
        imagePath.startsWith('data:') ||
        imagePath.startsWith('/')) {
      console.log('[TauriAsset] Path is absolute or URL, returning as-is');
      return imagePath;
    }

    // If no current file path, can't resolve relative path
    if (!currentFilePath) {
      console.warn('[TauriAsset] No current file path provided, cannot resolve relative path');
      return imagePath;
    }

    // Get directory of current file
    const lastSlash = currentFilePath.lastIndexOf('/');
    const lastBackslash = currentFilePath.lastIndexOf('\\');
    const separatorIndex = Math.max(lastSlash, lastBackslash);
    
    if (separatorIndex === -1) {
      console.warn('[TauriAsset] No separator found in current file path');
      return imagePath;
    }

    const directory = currentFilePath.substring(0, separatorIndex);
    
    // Join paths (handle both / and \)
    const separator = lastSlash > lastBackslash ? '/' : '\\';
    const resolved = `${directory}${separator}${imagePath}`;
    console.log('[TauriAsset] Resolved path:', resolved);
    return resolved;
  }

  /**
   * Get MIME type from file extension
   */
  private static getMimeType(filePath: string): string {
    const extension = filePath.split('.').pop()?.toLowerCase();
    
    const mimeTypes: Record<string, string> = {
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'gif': 'image/gif',
      'webp': 'image/webp',
      'svg': 'image/svg+xml',
      'bmp': 'image/bmp',
      'ico': 'image/x-icon',
    };

    return mimeTypes[extension || ''] || 'image/png';
  }
}
