import type { App } from '@inkdown/core';

/**
 * Resolves image path relative to current file
 */
export function resolveImagePath(imagePath: string, currentFilePath: string): string {
    // If it's already a full URL (http://, https://, data:, etc.), use as is
    if (imagePath.match(/^[a-z]+:/i)) {
        return imagePath;
    }

    // Get directory of current file
    const lastSlash = currentFilePath.lastIndexOf('/');
    const currentDir = lastSlash >= 0 ? currentFilePath.substring(0, lastSlash) : '';
    
    // Remove leading ./ if present
    const cleanPath = imagePath.replace(/^\.\//, '');
    
    // Join paths
    const absolutePath = currentDir ? `${currentDir}/${cleanPath}` : cleanPath;
    
    return absolutePath;
}

/**
 * Converts a file path to a data URL by reading via FileSystemManager
 */
export async function convertFileToDataUrl(app: App, filePath: string): Promise<string> {
    try {
        const bytes = await app.fileSystemManager.readFileBinary(filePath);
        
        // Convert Uint8Array to base64
        let binary = '';
        const len = bytes.byteLength;
        for (let i = 0; i < len; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        const base64 = btoa(binary);
        
        // Detect MIME type from file extension
        const ext = filePath.split('.').pop()?.toLowerCase();
        const mimeTypes: Record<string, string> = {
            'png': 'image/png',
            'jpg': 'image/jpeg',
            'jpeg': 'image/jpeg',
            'gif': 'image/gif',
            'webp': 'image/webp',
            'svg': 'image/svg+xml',
            'bmp': 'image/bmp',
        };
        const mimeType = mimeTypes[ext || ''] || 'image/png';
        
        return `data:${mimeType};base64,${base64}`;
    } catch (error) {
        console.error('[ImageLoader] Failed to read file:', filePath, error);
        throw error;
    }
}
