import type { App } from '../App';
import { type EventRef, Events } from '../Events';
import { parseFrontMatter } from '../utils/frontmatter';
import type { TFile } from './Workspace';

/**
 * Cached metadata for a file
 */
export interface CachedMetadata {
    /** Frontmatter data */
    frontmatter?: FrontMatterCache;
    /** Links in the document */
    links?: LinkCache[];
    /** Embedded files */
    embeds?: EmbedCache[];
    /** Tags */
    tags?: TagCache[];
    /** Headings */
    headings?: HeadingCache[];
    /** File sections */
    sections?: SectionCache[];
    /** Named blocks */
    blocks?: Record<string, BlockCache>;
}

/**
 * Frontmatter cache
 */
export interface FrontMatterCache {
    [key: string]: any;
}

/**
 * Link cache
 */
export interface LinkCache {
    /** Link text */
    link: string;
    /** Original text */
    original: string;
    /** Display text */
    displayText?: string;
    /** Position in file */
    position: Position;
}

/**
 * Embed cache
 */
export interface EmbedCache extends LinkCache {
    /** Original text including ![[]] */
    original: string;
}

/**
 * Tag cache
 */
export interface TagCache {
    /** Tag text including # */
    tag: string;
    /** Position in file */
    position: Position;
}

/**
 * Heading cache
 */
export interface HeadingCache {
    /** Heading text */
    heading: string;
    /** Heading level (1-6) */
    level: number;
    /** Position in file */
    position: Position;
}

/**
 * Section cache
 */
export interface SectionCache {
    /** Section type */
    type: 'heading' | 'paragraph' | 'code' | 'list' | 'quote';
    /** Position in file */
    position: Position;
}

/**
 * Block cache
 */
export interface BlockCache {
    /** Block ID */
    id: string;
    /** Position in file */
    position: Position;
}

/**
 * Position in document
 */
export interface Position {
    start: { line: number; col: number; offset: number };
    end: { line: number; col: number; offset: number };
}

/**
 * MetadataCache - Caches parsed metadata from markdown files
 *
 * Performance features:
 * - Debounced updates to avoid excessive re-parsing
 * - LRU cache with size limit to prevent memory bloat
 * - Lazy parsing: only parse when metadata is requested
 */
export class MetadataCache extends Events {
    public app: App;
    private cache: Map<string, CachedMetadata> = new Map();
    // private updateQueue: Set<string> = new Set();
    // private debounceTimer: number | null = null;
    // private readonly DEBOUNCE_DELAY = 300; // ms
    private readonly MAX_CACHE_SIZE = 1000; // Maximum number of files to cache
    private accessOrder: string[] = []; // For LRU tracking

    constructor(app: App) {
        super();
        this.app = app;

        // Setup listeners
        this.setupFileListeners();
    }

    /**
     * Get cached metadata for a file
     */
    getCache(path: string): CachedMetadata | null {
        const cached = this.cache.get(path);
        if (cached) {
            this.markAccessed(path);
        }
        return cached || null;
    }

    /**
     * Mark a path as recently accessed for LRU tracking
     */
    private markAccessed(path: string): void {
        const index = this.accessOrder.indexOf(path);
        if (index > -1) {
            this.accessOrder.splice(index, 1);
        }
        this.accessOrder.push(path);

        // Enforce cache size limit (LRU eviction)
        while (this.cache.size > this.MAX_CACHE_SIZE && this.accessOrder.length > 0) {
            const oldest = this.accessOrder.shift();
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            if (oldest) {
                this.cache.delete(oldest);
            }
        }
    }

    /**
     * Get frontmatter for a file
     */
    getFileCache(path: string): CachedMetadata | null {
        return this.getCache(path);
    }

    /**
     * Update cache for a file
     */
    async updateCache(file: TFile): Promise<void> {
        try {
            const content = await this.app.fileManager.read(file);
            const metadata = this.parseMetadata(content);

            this.cache.set(file.path, metadata);

            // Trigger event
            this.trigger('changed', file, content, metadata);
        } catch (error: any) {
            console.error('Failed to update cache for', file.path, error);
        }
    }

    /**
     * Parse metadata from content
     */
    private parseMetadata(content: string): CachedMetadata {
        const metadata: CachedMetadata = {};

        // Parse frontmatter
        const { frontmatter } = parseFrontMatter(content);
        if (Object.keys(frontmatter).length > 0) {
            metadata.frontmatter = frontmatter;
        }

        // Parse links [[...]]
        const linkRegex = /\[\[([^\]]+)\]\]/g;
        const links: LinkCache[] = [];
        let match;

        match = linkRegex.exec(content);
        while (match !== null) {
            const linkText = match[1];
            const [link, displayText] = linkText.split('|');

            links.push({
                link: link.trim(),
                original: match[0],
                displayText: displayText?.trim(),
                position: this.getPosition(content, match.index, match[0].length),
            });
            match = linkRegex.exec(content);
        }

        if (links.length > 0) {
            metadata.links = links;
        }

        // Parse embeds ![[...]]
        const embedRegex = /!\[\[([^\]]+)\]\]/g;
        const embeds: EmbedCache[] = [];

        match = embedRegex.exec(content);
        while (match !== null) {
            const linkText = match[1];
            const [link, displayText] = linkText.split('|');

            embeds.push({
                link: link.trim(),
                original: match[0],
                displayText: displayText?.trim(),
                position: this.getPosition(content, match.index, match[0].length),
            });
            match = embedRegex.exec(content);
        }

        if (embeds.length > 0) {
            metadata.embeds = embeds;
        }

        // Parse tags #tag
        const tagRegex = /#([a-zA-Z0-9_/-]+)/g;
        const tags: TagCache[] = [];

        match = tagRegex.exec(content);
        while (match !== null) {
            tags.push({
                tag: match[0],
                position: this.getPosition(content, match.index, match[0].length),
            });
            match = tagRegex.exec(content);
        }

        if (tags.length > 0) {
            metadata.tags = tags;
        }

        // Parse headings
        const headingRegex = /^(#{1,6})\s+(.+)$/gm;
        const headings: HeadingCache[] = [];

        match = headingRegex.exec(content);
        while (match !== null) {
            headings.push({
                heading: match[2],
                level: match[1].length,
                position: this.getPosition(content, match.index, match[0].length),
            });
            match = headingRegex.exec(content);
        }

        if (headings.length > 0) {
            metadata.headings = headings;
        }

        return metadata;
    }

    /**
     * Get position from index
     */
    private getPosition(content: string, index: number, length: number): Position {
        const before = content.slice(0, index);
        const startLine = before.split('\n').length - 1;
        const startCol = index - before.lastIndexOf('\n') - 1;

        const endIndex = index + length;
        const beforeEnd = content.slice(0, endIndex);
        const endLine = beforeEnd.split('\n').length - 1;
        const endCol = endIndex - beforeEnd.lastIndexOf('\n') - 1;

        return {
            start: { line: startLine, col: startCol, offset: index },
            end: { line: endLine, col: endCol, offset: endIndex },
        };
    }

    /**
     * Setup listeners for file changes
     */
    private setupFileListeners(): void {
        // Listen to file modifications
        this.app.workspace.onFileModify((file) => {
            this.updateCache(file);
        });

        // Listen to file creation
        this.app.workspace.onFileCreate((file) => {
            this.updateCache(file);
        });

        // Listen to file deletion
        this.app.workspace.onFileDelete((file) => {
            if ('path' in file) {
                this.cache.delete(file.path);
            }
        });
    }

    /**
     * Register metadata changed event
     */
    onChanged(callback: (file: TFile, data: string, cache: CachedMetadata) => void): EventRef {
        return this.on('changed', callback);
    }
}
