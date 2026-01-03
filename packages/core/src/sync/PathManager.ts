import type { App } from '../App';

/**
 * PathManager - Manages file paths and directory structure for sync
 * 
 * SOLID Principles:
 * - Single Responsibility: Handles all path-related operations
 * - Open/Closed: Easy to extend with new path transformations
 * - Liskov Substitution: Can be mocked/replaced for testing
 * - Interface Segregation: Focused interface for path operations
 * - Dependency Inversion: Depends on App abstraction, not concrete implementations
 */
export class PathManager {
  private app: App;
  private workspaceRoot: string;

  constructor(app: App, workspaceRoot: string) {
    this.app = app;
    this.workspaceRoot = workspaceRoot;
  }

  /**
   * Extract relative path from full file path
   * Example: "/Users/john/workspace/java/spring.md" → "java/spring.md"
   */
  getRelativePath(fullPath: string): string {
    if (fullPath.startsWith(this.workspaceRoot)) {
      const relative = fullPath.substring(this.workspaceRoot.length);
      return relative.startsWith('/') ? relative.substring(1) : relative;
    }
    return fullPath;
  }

  /**
   * Get full path from relative path
   * Example: "java/spring.md" → "/Users/john/workspace/java/spring.md"
   */
  getFullPath(relativePath: string): string {
    // Remove leading slash if present
    const cleanPath = relativePath.startsWith('/') ? relativePath.substring(1) : relativePath;
    return `${this.workspaceRoot}/${cleanPath}`;
  }

  /**
   * Extract title with directory structure from path
   * Example: "/Users/john/workspace/java/spring.md" → "java/spring"
   */
  extractTitle(fullPath: string): string {
    const relativePath = this.getRelativePath(fullPath);
    // Remove .md extension
    return relativePath.replace(/\.md$/, '');
  }

  /**
   * Sanitize and reconstruct full path from title (preserves directory structure)
   * Example: "java/spring" → "/Users/john/workspace/java/spring.md"
   */
  sanitizePath(title: string): string {
    // Split into directory parts
    const parts = title.split('/').filter(p => p.length > 0);
    
    if (parts.length === 0) {
      throw new Error('Invalid title: cannot be empty');
    }
    
    // Sanitize each part (remove invalid characters)
    const sanitizedParts = parts.map(part => 
      part.replace(/[\\?%*:|"<>]/g, '-')
    );
    
    // Last part is the filename - add .md extension if not present
    const filename = sanitizedParts[sanitizedParts.length - 1];
    const filenameWithExt = filename.endsWith('.md') ? filename : `${filename}.md`;
    
    // Reconstruct path with directories
    const directoryParts = sanitizedParts.slice(0, -1);
    const relativePath = directoryParts.length > 0
      ? `${directoryParts.join('/')}/${filenameWithExt}`
      : filenameWithExt;
    
    return this.getFullPath(relativePath);
  }

  /**
   * Get directory path from file path
   * Example: "/Users/john/workspace/java/spring.md" → "/Users/john/workspace/java"
   */
  getDirectoryPath(filePath: string): string | null {
    const lastSlash = filePath.lastIndexOf('/');
    if (lastSlash === -1) return null;
    return filePath.substring(0, lastSlash);
  }

  /**
   * Ensure all parent directories exist for a given file path
   * Creates directories recursively if they don't exist
   */
  async ensureDirectoryExists(filePath: string): Promise<void> {
    const dirPath = this.getDirectoryPath(filePath);
    if (!dirPath) return; // No directory (file in root)
    
    // Check if directory already exists
    const exists = await this.app.fileSystemManager.exists(dirPath);
    if (exists) return;
    
    // Create parent directories recursively
    const parentDir = this.getDirectoryPath(dirPath);
    if (parentDir) {
      await this.ensureDirectoryExists(dirPath);
    }
    
    // Create this directory
    try {
      await this.app.fileSystemManager.createDirectory(dirPath);
    } catch (error) {
      // Directory might have been created by another concurrent operation
      const nowExists = await this.app.fileSystemManager.exists(dirPath);
      if (!nowExists) {
        throw error; // Re-throw if it really failed
      }
    }
  }

  /**
   * Check if a path is a child of another path
   */
  isChildOf(childPath: string, parentPath: string): boolean {
    const normalizedChild = childPath.endsWith('/') ? childPath : `${childPath}/`;
    const normalizedParent = parentPath.endsWith('/') ? parentPath : `${parentPath}/`;
    return normalizedChild.startsWith(normalizedParent);
  }

  /**
   * Get all parent directory paths for a file
   * Example: "java/spring/boot.md" → ["java", "java/spring"]
   */
  getParentDirectories(relativePath: string): string[] {
    const parts = relativePath.split('/');
    const directories: string[] = [];
    
    // Build cumulative paths (exclude the file itself)
    for (let i = 0; i < parts.length - 1; i++) {
      const dirPath = parts.slice(0, i + 1).join('/');
      directories.push(dirPath);
    }
    
    return directories;
  }
}
