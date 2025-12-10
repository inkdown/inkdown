/**
 * Context passed to markdown processors
 */
export interface MarkdownPostProcessorContext {
    /** Source path of the file */
    sourcePath: string;
    /** Additional metadata */
    frontmatter?: Record<string, any>;
    /** Section information */
    getSectionInfo?: (el: HTMLElement) => SectionInfo | null;
}

/**
 * Section information
 */
export interface SectionInfo {
    /** Line start */
    lineStart: number;
    /** Line end */
    lineEnd: number;
    /** Section text */
    text: string;
}

/**
 * Markdown code block processor
 *
 * PERFORMANCE: Processors are cached by language
 * Only matching code blocks are processed
 */
export type MarkdownCodeBlockProcessor = (
    source: string,
    el: HTMLElement,
    ctx: MarkdownPostProcessorContext,
) => void | Promise<void>;

/**
 * Markdown post processor
 *
 * PERFORMANCE: Run in order of registration
 * Use ctx.getSectionInfo() to avoid re-parsing
 */
export type MarkdownPostProcessor = (
    el: HTMLElement,
    ctx: MarkdownPostProcessorContext,
) => void | Promise<void>;

/**
 * MarkdownProcessor - Registry for markdown processors
 * Manages code block and post processors with performance optimization
 */
export class MarkdownProcessorRegistry {
    private codeBlockProcessors: Map<string, Set<MarkdownCodeBlockProcessor>> = new Map();
    private postProcessors: Set<MarkdownPostProcessor> = new Set();

    /**
     * Register a code block processor for a specific language
     *
     * PERFORMANCE: Processors are organized by language for O(1) lookup
     */
    registerCodeBlockProcessor(language: string, processor: MarkdownCodeBlockProcessor): void {
        if (!this.codeBlockProcessors.has(language)) {
            this.codeBlockProcessors.set(language, new Set());
        }
        this.codeBlockProcessors.get(language)?.add(processor);
    }

    /**
     * Register a post processor
     * Runs after all markdown is rendered
     */
    registerPostProcessor(processor: MarkdownPostProcessor): void {
        this.postProcessors.add(processor);
    }

    /**
     * Process a code block
     * PERFORMANCE: Only runs processors for matching language
     */
    async processCodeBlock(
        language: string,
        source: string,
        el: HTMLElement,
        ctx: MarkdownPostProcessorContext,
    ): Promise<void> {
        const processors = this.codeBlockProcessors.get(language);
        if (!processors || processors.size === 0) return;

        // Run all processors for this language
        for (const processor of processors) {
            try {
                await processor(source, el, ctx);
            } catch (error: any) {
                console.error(`Error in code block processor for ${language}:`, error);
            }
        }
    }

    /**
     * Run post processors
     * PERFORMANCE: Batch DOM operations where possible
     */
    async runPostProcessors(el: HTMLElement, ctx: MarkdownPostProcessorContext): Promise<void> {
        // Run in registration order
        for (const processor of this.postProcessors) {
            try {
                await processor(el, ctx);
            } catch (error: any) {
                console.error('Error in markdown post processor:', error);
            }
        }
    }

    /**
     * Check if there are any processors for a language
     * PERFORMANCE: O(1) check before processing
     */
    hasCodeBlockProcessor(language: string): boolean {
        return (
            this.codeBlockProcessors.has(language) &&
            (this.codeBlockProcessors.get(language)?.size ?? 0) > 0
        );
    }

    /**
     * Unregister a code block processor
     */
    unregisterCodeBlockProcessor(language: string, processor: MarkdownCodeBlockProcessor): void {
        const processors = this.codeBlockProcessors.get(language);
        if (processors) {
            processors.delete(processor);
            if (processors.size === 0) {
                this.codeBlockProcessors.delete(language);
            }
        }
    }

    /**
     * Unregister a post processor
     */
    unregisterPostProcessor(processor: MarkdownPostProcessor): void {
        this.postProcessors.delete(processor);
    }

    /**
     * Clear all processors
     */
    clear(): void {
        this.codeBlockProcessors.clear();
        this.postProcessors.clear();
    }
}
