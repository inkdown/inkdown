/**
 * IFileSystem Interface
 * 
 * File system operations - REQUIRED on all platforms
 */

import type { FileNode } from '../types';

export interface IFileSystem {
  // ============================================================================
  // Read Operations
  // ============================================================================
  
  /**
   * Read file contents as string
   */
  readFile(path: string): Promise<string>;
  
  /**
   * Read file contents as binary (Uint8Array)
   */
  readFileBinary(path: string): Promise<Uint8Array>;
  
  /**
   * Read directory contents
   * @param path - Directory path
   * @param recursive - Whether to read subdirectories
   */
  readDirectory(path: string, recursive?: boolean): Promise<FileNode[]>;
  
  /**
   * Check if path exists
   */
  exists(path: string): Promise<boolean>;
  
  // ============================================================================
  // Write Operations
  // ============================================================================
  
  /**
   * Write string content to file
   */
  writeFile(path: string, content: string): Promise<void>;
  
  /**
   * Write binary content to file
   */
  writeFileBinary(path: string, data: Uint8Array): Promise<void>;
  
  /**
   * Create a directory (and parent directories if needed)
   */
  createDirectory(path: string): Promise<void>;
  
  // ============================================================================
  // File Operations
  // ============================================================================
  
  /**
   * Rename/move a file or directory
   */
  rename(oldPath: string, newPath: string): Promise<void>;
  
  /**
   * Delete a file or directory
   */
  delete(path: string): Promise<void>;
  
  /**
   * Move a file or directory
   */
  move(source: string, destination: string): Promise<void>;
  
  /**
   * Copy a file or directory
   */
  copy(source: string, destination: string): Promise<void>;

  // ============================================================================
  // Plugin File Operations
  // ============================================================================
  
  /**
   * Read a file from a plugin's directory
   * @param pluginId - Plugin identifier
   * @param fileName - File name within the plugin directory
   */
  readPluginFile(pluginId: string, fileName: string): Promise<string>;
  
  /**
   * Write a file to a plugin's directory
   * @param pluginId - Plugin identifier
   * @param fileName - File name within the plugin directory
   * @param content - File content
   */
  writePluginFile(pluginId: string, fileName: string, content: string): Promise<void>;
  
  /**
   * Delete a plugin's directory and all its contents
   * @param pluginId - Plugin identifier
   */
  deletePluginDir(pluginId: string): Promise<void>;
  
  /**
   * Ensure a directory exists (create if needed)
   * @param path - Directory path
   */
  ensureDir(path: string): Promise<void>;

  // ============================================================================
  // Theme File Operations
  // ============================================================================
  
  /**
   * List custom themes directories
   */
  listCustomThemes(): Promise<string[]>;
  
  /**
   * Read a theme's manifest.json
   * @param themeName - Theme directory name
   */
  readThemeManifest(themeName: string): Promise<string>;
  
  /**
   * Read a theme's CSS file
   * @param themeName - Theme directory name  
   * @param cssFile - CSS file name (e.g., 'dark.css', 'light.css')
   */
  readThemeCss(themeName: string, cssFile: string): Promise<string>;
  
  /**
   * Install a file for a community theme
   * @param themeName - Theme directory name
   * @param fileName - File name
   * @param content - File content
   */
  installCommunityThemeFile(themeName: string, fileName: string, content: string): Promise<void>;
  
  /**
   * Uninstall a community theme (remove its directory)
   * @param themeName - Theme directory name
   */
  uninstallCommunityTheme(themeName: string): Promise<void>;
}
