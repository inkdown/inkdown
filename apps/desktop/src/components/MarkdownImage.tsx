import type { App } from '@inkdown/core';
import React, { useEffect, useState } from 'react';

interface MarkdownImageProps {
    src?: string;
    alt?: string;
    title?: string;
    app: App;
    currentFilePath?: string;
    className?: string;
}

/**
 * Resolves image path relative to current file
 */
function resolveImagePath(imagePath: string, currentFilePath: string | undefined): string {
    // If it's an absolute path or URL, return as is
    if (
        imagePath.startsWith('http://') ||
        imagePath.startsWith('https://') ||
        imagePath.startsWith('data:') ||
        imagePath.startsWith('/')
    ) {
        return imagePath;
    }

    // If no current file path, can't resolve relative path
    if (!currentFilePath) {
        return imagePath;
    }

    // Get directory of current file
    const lastSlash = currentFilePath.lastIndexOf('/');
    if (lastSlash === -1) {
        return imagePath;
    }

    const directory = currentFilePath.substring(0, lastSlash);
    return `${directory}/${imagePath}`;
}

/**
 * Convert file to data URL using App's FileSystemManager
 */
async function convertFileToDataUrl(app: App, filePath: string): Promise<string> {
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
        png: 'image/png',
        jpg: 'image/jpeg',
        jpeg: 'image/jpeg',
        gif: 'image/gif',
        webp: 'image/webp',
        svg: 'image/svg+xml',
        bmp: 'image/bmp',
    };
    const mimeType = mimeTypes[ext || ''] || 'image/png';

    return `data:${mimeType};base64,${base64}`;
}

/**
 * MarkdownImage - Custom image component for markdown preview
 * Handles loading local images using App's FileSystemManager
 */
export const MarkdownImage: React.FC<MarkdownImageProps> = ({
    src,
    alt,
    title,
    app,
    currentFilePath,
    className,
}) => {
    const [imageSrc, setImageSrc] = useState<string>('');
    const [error, setError] = useState<string>('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!src) {
            setError('No image source provided');
            setLoading(false);
            return;
        }

        // If it's already a URL (http, https, data), use it directly
        if (src.startsWith('http://') || src.startsWith('https://') || src.startsWith('data:')) {
            setImageSrc(src);
            setLoading(false);
            return;
        }

        // It's a local file path - need to load via App
        const loadImage = async () => {
            try {
                setLoading(true);
                setError('');

                console.log('[MarkdownImage] Loading image:', { src, currentFilePath });

                // Resolve relative path
                const resolvedPath = resolveImagePath(src, currentFilePath);
                console.log('[MarkdownImage] Resolved path:', resolvedPath);

                // Convert to data URL
                const dataUrl = await convertFileToDataUrl(app, resolvedPath);
                console.log('[MarkdownImage] Data URL created, length:', dataUrl.length);
                setImageSrc(dataUrl);
            } catch (err) {
                console.error('[MarkdownImage] Failed to load image:', err);
                setError(`Failed to load image: ${src}`);
            } finally {
                setLoading(false);
            }
        };

        loadImage();
    }, [src, currentFilePath, app]);

    if (loading) {
        return (
            <div className="markdown-image-loading" style={{ 
                padding: '8px', 
                color: 'var(--text-muted)',
                fontStyle: 'italic',
            }}>
                Loading image...
            </div>
        );
    }

    if (error) {
        return (
            <div className="markdown-image-error" style={{ 
                padding: '8px', 
                color: 'var(--text-error, red)',
                border: '1px dashed var(--border-color)',
                borderRadius: '4px',
            }}>
                ❌ {error}
            </div>
        );
    }

    return (
        <img
            src={imageSrc}
            alt={alt}
            title={title}
            className={className}
            onError={() => setError(`Failed to display: ${alt || 'Image'}`)}
        />
    );
};
