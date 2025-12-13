/**
 * @inkdown/core/editor/extensions
 *
 * Configurable CodeMirror extensions for the Inkdown editor.
 * These extensions can be enabled/disabled via EditorConfig.
 */

import { closeBrackets, closeBracketsKeymap } from '@codemirror/autocomplete';
import { indentWithTab } from '@codemirror/commands';
import {
    Compartment,
    type Extension,
    RangeSetBuilder,
    StateEffect,
    StateField,
} from '@codemirror/state';
import {
    Decoration,
    EditorView,
    GutterMarker,
    gutter,
    keymap,
    lineNumbers,
    WidgetType,
} from '@codemirror/view';
import { vim } from '@replit/codemirror-vim';

/**
 * Editor configuration interface
 * Matches the EditorConfig in SettingsModal
 */
export interface EditorConfig {
    /** Auto-insert closing brackets, quotes, parentheses */
    autoPairBrackets: boolean;
    /** Use Tab key for indentation */
    tabIndentation: boolean;
    /** Convert pasted HTML to Markdown */
    convertPastedHtmlToMarkdown: boolean;
    /** Enable Vim keybindings */
    vimMode: boolean;
    /** Show line numbers in the editor */
    showLineNumbers: boolean;
    /** Enable folding of heading sections */
    foldHeading: boolean;
}

/**
 * Default editor configuration
 */
export const DEFAULT_EDITOR_CONFIG: EditorConfig = {
    autoPairBrackets: true,
    tabIndentation: true,
    convertPastedHtmlToMarkdown: true,
    vimMode: false,
    showLineNumbers: false,
    foldHeading: true,
};

/**
 * Compartments for dynamic reconfiguration of extensions
 * These allow extensions to be toggled on/off without recreating the editor
 */
export const editorCompartments = {
    closeBrackets: new Compartment(),
    tabIndentation: new Compartment(),
    pasteHtmlToMarkdown: new Compartment(),
    vimMode: new Compartment(),
    lineNumbers: new Compartment(),
    foldHeading: new Compartment(),
};

/**
 * Creates the close brackets extension based on config
 */
export function createCloseBracketsExtension(enabled: boolean): Extension {
    if (enabled) {
        return [closeBrackets(), keymap.of(closeBracketsKeymap)];
    }
    return [];
}

/**
 * Creates the tab indentation extension based on config
 */
export function createTabIndentationExtension(enabled: boolean): Extension {
    if (enabled) {
        return keymap.of([indentWithTab]);
    }
    return [];
}

/**
 * Simple HTML to Markdown converter
 * Handles common HTML elements without external dependencies
 */
function htmlToMarkdown(html: string): string {
    // Create a temporary DOM element to parse HTML
    const doc = new DOMParser().parseFromString(html, 'text/html');

    function processNode(node: Node): string {
        if (node.nodeType === Node.TEXT_NODE) {
            return node.textContent || '';
        }

        if (node.nodeType !== Node.ELEMENT_NODE) {
            return '';
        }

        const element = node as HTMLElement;
        const tagName = element.tagName.toLowerCase();
        const children = Array.from(element.childNodes).map(processNode).join('');

        switch (tagName) {
            // Headers
            case 'h1':
                return `# ${children}\n\n`;
            case 'h2':
                return `## ${children}\n\n`;
            case 'h3':
                return `### ${children}\n\n`;
            case 'h4':
                return `#### ${children}\n\n`;
            case 'h5':
                return `##### ${children}\n\n`;
            case 'h6':
                return `###### ${children}\n\n`;

            // Formatting
            case 'strong':
            case 'b':
                return `**${children}**`;
            case 'em':
            case 'i':
                return `*${children}*`;
            case 'u':
                return `<u>${children}</u>`;
            case 's':
            case 'strike':
            case 'del':
                return `~~${children}~~`;
            case 'code':
                return `\`${children}\``;
            case 'mark':
                return `==${children}==`;

            // Links and images
            case 'a': {
                const href = element.getAttribute('href') || '';
                return `[${children}](${href})`;
            }
            case 'img': {
                const src = element.getAttribute('src') || '';
                const alt = element.getAttribute('alt') || '';
                return `![${alt}](${src})`;
            }

            // Lists
            case 'ul':
                return `${children}\n`;
            case 'ol':
                return `${children}\n`;
            case 'li': {
                const parent = element.parentElement;
                if (parent?.tagName.toLowerCase() === 'ol') {
                    const index = Array.from(parent.children).indexOf(element) + 1;
                    return `${index}. ${children}\n`;
                }
                return `- ${children}\n`;
            }

            // Block elements
            case 'p':
                return `${children}\n\n`;
            case 'br':
                return '\n';
            case 'hr':
                return '\n---\n\n';
            case 'blockquote':
                return `> ${children.replace(/\n/g, '\n> ')}\n\n`;
            case 'pre': {
                const codeEl = element.querySelector('code');
                const lang = codeEl?.className.match(/language-(\w+)/)?.[1] || '';
                const code = codeEl?.textContent || children;
                return `\`\`\`${lang}\n${code}\n\`\`\`\n\n`;
            }

            // Table elements
            case 'table':
                return processTable(element);

            // Container elements - just return children
            case 'div':
            case 'span':
            case 'article':
            case 'section':
            case 'main':
            case 'body':
            case 'html':
                return children;

            default:
                return children;
        }
    }

    function processTable(table: HTMLElement): string {
        const rows = Array.from(table.querySelectorAll('tr'));
        if (rows.length === 0) return '';

        const result: string[] = [];

        rows.forEach((row, rowIndex) => {
            const cells = Array.from(row.querySelectorAll('th, td'));
            const cellContents = cells.map((cell) => processNode(cell).trim());
            result.push(`| ${cellContents.join(' | ')} |`);

            // Add separator after header row
            if (rowIndex === 0) {
                result.push(`| ${cells.map(() => '---').join(' | ')} |`);
            }
        });

        return `${result.join('\n')}\n\n`;
    }

    const result = processNode(doc.body);
    // Clean up extra newlines
    return result.replace(/\n{3,}/g, '\n\n').trim();
}

/**
 * Creates the paste HTML to Markdown extension
 */
export function createPasteHtmlToMarkdownExtension(enabled: boolean): Extension {
    if (!enabled) {
        return [];
    }

    return EditorView.domEventHandlers({
        paste(event, view) {
            const clipboardData = event.clipboardData;
            if (!clipboardData) return false;

            // Skip if there are image files in clipboard - let image paste handler deal with it
            const items = Array.from(clipboardData.items);
            const hasImageFile = items.some(
                (item) => item.kind === 'file' && item.type.startsWith('image/'),
            );
            if (hasImageFile) {
                return false;
            }

            // Check if HTML is available in text/html format (from rich content like web pages)
            const html = clipboardData.getData('text/html');
            // Also get plain text to check if it contains HTML tags
            const plainText = clipboardData.getData('text/plain');

            // Determine which content to convert
            let contentToConvert: string | null = null;

            // First priority: actual HTML content from clipboard
            if (html?.trim()) {
                const hasRichContent =
                    /<(h[1-6]|p|ul|ol|li|table|a|img|strong|em|b|i|code|pre|blockquote)/i.test(
                        html,
                    );
                if (hasRichContent) {
                    contentToConvert = html;
                }
            }

            // Second priority: plain text that looks like HTML (e.g., pasted HTML code)
            if (!contentToConvert && plainText && plainText.trim()) {
                // Check if plain text contains HTML tags
                const looksLikeHtml =
                    /^\s*<(!DOCTYPE|html|head|body|h[1-6]|p|div|span|ul|ol|li|table|a|img|strong|em|b|i|code|pre|blockquote|article|section|header|footer|nav|main)/i.test(
                        plainText.trim(),
                    );

                if (looksLikeHtml) {
                    contentToConvert = plainText;
                }
            }

            if (contentToConvert) {
                event.preventDefault();

                const markdown = htmlToMarkdown(contentToConvert);

                const { from, to } = view.state.selection.main;
                view.dispatch({
                    changes: { from, to, insert: markdown },
                    selection: { anchor: from + markdown.length },
                });

                return true;
            }

            return false;
        },
    });
}

/**
 * Creates the Vim mode extension
 */
export function createVimModeExtension(enabled: boolean): Extension {
    if (!enabled) {
        return [];
    }

    return vim();
}

/**
 * Creates the line numbers extension
 */
export function createLineNumbersExtension(enabled: boolean): Extension {
    if (!enabled) {
        return [];
    }

    return lineNumbers();
}

// ============================================================================
// Heading Fold Extension
// ============================================================================

/**
 * Effect to toggle fold state for a heading
 */
const toggleHeadingFold = StateEffect.define<{ from: number; to: number }>();

/**
 * State field to track folded heading ranges
 */
const foldedHeadingsField = StateField.define<Set<number>>({
    create() {
        return new Set();
    },
    update(folded, tr) {
        let newFolded = folded;
        for (const effect of tr.effects) {
            if (effect.is(toggleHeadingFold)) {
                newFolded = new Set(folded);
                if (newFolded.has(effect.value.from)) {
                    newFolded.delete(effect.value.from);
                } else {
                    newFolded.add(effect.value.from);
                }
            }
        }
        // Remap positions on document changes
        if (tr.docChanged && newFolded.size > 0) {
            const remapped = new Set<number>();
            for (const pos of newFolded) {
                const newPos = tr.changes.mapPos(pos, 1);
                remapped.add(newPos);
            }
            return remapped;
        }
        return newFolded;
    },
});

/**
 * Widget to show folded indicator
 */
class FoldedIndicatorWidget extends WidgetType {
    constructor(readonly lineCount: number) {
        super();
    }

    toDOM() {
        const span = document.createElement('span');
        span.className = 'cm-heading-fold-indicator';
        span.textContent = `  ···  (${this.lineCount} lines)`;
        span.title = 'Click to unfold';
        return span;
    }

    ignoreEvent() {
        return false;
    }
}

/**
 * Gutter marker for fold toggle button
 */
class HeadingFoldMarker extends GutterMarker {
    constructor(
        readonly isFolded: boolean,
        readonly level: number,
    ) {
        super();
    }

    toDOM() {
        const span = document.createElement('span');
        span.className = `cm-heading-fold-gutter ${this.isFolded ? 'folded' : 'expanded'}`;
        span.textContent = this.isFolded ? '▶' : '▼';
        span.title = this.isFolded ? 'Click to expand' : 'Click to collapse';
        return span;
    }
}

/**
 * Parse document to find heading ranges
 */
function findHeadingRanges(doc: {
    toString(): string;
    lineAt(pos: number): { from: number; to: number; number: number; text: string };
    lines: number;
    line(n: number): { from: number; to: number; text: string };
}): Array<{ level: number; from: number; to: number; lineStart: number; lineEnd: number }> {
    const headings: Array<{
        level: number;
        from: number;
        to: number;
        lineStart: number;
        lineEnd: number;
    }> = [];
    const headingRegex = /^(#{1,6})\s+/;

    for (let i = 1; i <= doc.lines; i++) {
        const line = doc.line(i);
        const match = line.text.match(headingRegex);
        if (match) {
            headings.push({
                level: match[1].length,
                from: line.from,
                to: line.to,
                lineStart: i,
                lineEnd: i, // Will be updated
            });
        }
    }

    // Calculate the end of each heading section
    for (let i = 0; i < headings.length; i++) {
        const current = headings[i];
        let endLine = doc.lines;

        // Find next heading of same or higher level
        for (let j = i + 1; j < headings.length; j++) {
            if (headings[j].level <= current.level) {
                endLine = headings[j].lineStart - 1;
                break;
            }
        }

        current.lineEnd = endLine;
        current.to = doc.line(endLine).to;
    }

    return headings;
}

/**
 * Extension for fold decorations
 */
const foldDecorationsExtension = EditorView.decorations.compute([foldedHeadingsField], (state) => {
    const folded = state.field(foldedHeadingsField);
    if (folded.size === 0) {
        return Decoration.none;
    }

    const headings = findHeadingRanges(state.doc);
    const builder = new RangeSetBuilder<Decoration>();
    const decorations: Array<{ from: number; to: number; decoration: Decoration }> = [];

    for (const heading of headings) {
        if (folded.has(heading.from)) {
            const linesHidden = heading.lineEnd - heading.lineStart;
            if (linesHidden > 0) {
                const headingLine = state.doc.line(heading.lineStart);
                const endLine = state.doc.line(heading.lineEnd);

                decorations.push({
                    from: headingLine.to,
                    to: endLine.to,
                    decoration: Decoration.replace({
                        widget: new FoldedIndicatorWidget(linesHidden),
                    }),
                });
            }
        }
    }

    decorations.sort((a, b) => a.from - b.from);
    for (const { from, to, decoration } of decorations) {
        builder.add(from, to, decoration);
    }

    return builder.finish();
});

/**
 * Gutter for heading fold toggle
 */
const headingFoldGutter = gutter({
    class: 'cm-heading-fold-gutter-container',
    markers: (view) => {
        const folded = view.state.field(foldedHeadingsField);
        const headings = findHeadingRanges(view.state.doc);
        const builder = new RangeSetBuilder<GutterMarker>();

        for (const heading of headings) {
            const isFolded = folded.has(heading.from);
            // Only show marker if heading has content to fold
            if (heading.lineEnd > heading.lineStart) {
                builder.add(
                    heading.from,
                    heading.from,
                    new HeadingFoldMarker(isFolded, heading.level),
                );
            }
        }

        return builder.finish();
    },
    domEventHandlers: {
        click: (view, line) => {
            const headings = findHeadingRanges(view.state.doc);
            const heading = headings.find((h) => {
                const headingLine = view.state.doc.lineAt(h.from);
                return headingLine.from === line.from;
            });

            if (heading && heading.lineEnd > heading.lineStart) {
                view.dispatch({
                    effects: toggleHeadingFold.of({ from: heading.from, to: heading.to }),
                });
                return true;
            }
            return false;
        },
    },
});

/**
 * Click handler for heading lines to toggle fold
 */
const headingClickHandler = EditorView.domEventHandlers({
    click: (event, view) => {
        // Check if clicking on fold indicator
        const target = event.target as HTMLElement;
        if (target.classList.contains('cm-heading-fold-indicator')) {
            const pos = view.posAtDOM(target);
            const line = view.state.doc.lineAt(pos);
            const headings = findHeadingRanges(view.state.doc);

            // Find which heading this indicator belongs to
            for (const heading of headings) {
                const headingLine = view.state.doc.line(heading.lineStart);
                if (line.from >= headingLine.from && line.from <= heading.to) {
                    view.dispatch({
                        effects: toggleHeadingFold.of({ from: heading.from, to: heading.to }),
                    });
                    return true;
                }
            }
        }
        return false;
    },
});

/**
 * Theme for heading fold
 */
const headingFoldTheme = EditorView.baseTheme({
    '.cm-heading-fold-indicator': {
        color: 'var(--text-muted, #888)',
        backgroundColor: 'var(--bg-secondary, #2a2a2a)',
        padding: '0 4px',
        borderRadius: '3px',
        fontSize: '0.85em',
        cursor: 'pointer',
        marginLeft: '4px',
        '&:hover': {
            backgroundColor: 'var(--bg-tertiary, #3a3a3a)',
        },
    },
    '.cm-heading-fold-gutter-container': {
        width: '16px',
        cursor: 'pointer',
    },
    '.cm-heading-fold-gutter': {
        color: 'var(--text-muted, #888)',
        fontSize: '10px',
        padding: '0 2px',
        '&:hover': {
            color: 'var(--text-primary, #fff)',
        },
        '&.folded': {
            color: 'var(--color-primary, #007acc)',
        },
    },
});

/**
 * Creates the heading fold extension
 */
export function createHeadingFoldExtension(enabled: boolean): Extension {
    if (!enabled) {
        return [];
    }

    return [
        foldedHeadingsField,
        foldDecorationsExtension,
        headingFoldGutter,
        headingClickHandler,
        headingFoldTheme,
    ];
}

/**
 * Creates all configurable editor extensions based on the provided config
 * Uses compartments for dynamic reconfiguration
 */
export function createConfigurableExtensions(config: EditorConfig): Extension[] {
    return [
        editorCompartments.closeBrackets.of(createCloseBracketsExtension(config.autoPairBrackets)),
        editorCompartments.tabIndentation.of(createTabIndentationExtension(config.tabIndentation)),
        editorCompartments.pasteHtmlToMarkdown.of(
            createPasteHtmlToMarkdownExtension(config.convertPastedHtmlToMarkdown),
        ),
        editorCompartments.vimMode.of(createVimModeExtension(config.vimMode)),
        editorCompartments.lineNumbers.of(createLineNumbersExtension(config.showLineNumbers)),
        editorCompartments.foldHeading.of(createHeadingFoldExtension(config.foldHeading)),
    ];
}

/**
 * Updates the editor extensions dynamically when config changes
 * Returns the transaction specs needed to reconfigure the editor
 */
export function getReconfigurationEffects(config: EditorConfig) {
    return [
        editorCompartments.closeBrackets.reconfigure(
            createCloseBracketsExtension(config.autoPairBrackets),
        ),
        editorCompartments.tabIndentation.reconfigure(
            createTabIndentationExtension(config.tabIndentation),
        ),
        editorCompartments.pasteHtmlToMarkdown.reconfigure(
            createPasteHtmlToMarkdownExtension(config.convertPastedHtmlToMarkdown),
        ),
        editorCompartments.vimMode.reconfigure(createVimModeExtension(config.vimMode)),
        editorCompartments.lineNumbers.reconfigure(
            createLineNumbersExtension(config.showLineNumbers),
        ),
        editorCompartments.foldHeading.reconfigure(createHeadingFoldExtension(config.foldHeading)),
    ];
}

// ============================================================================
// Image Paste Handler
// ============================================================================

import type { App } from '../../App';

/**
 * Generate a unique filename for pasted images
 */
function generateImageFilename(mimeType: string): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    const extension = mimeType.includes('png')
        ? 'png'
        : mimeType.includes('gif')
          ? 'gif'
          : mimeType.includes('webp')
            ? 'webp'
            : 'jpg';
    return `pasted-image-${timestamp}-${random}.${extension}`;
}

/**
 * Convert Blob to base64
 */
async function blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            const base64 = reader.result as string;
            // Remove data URL prefix (e.g., "data:image/png;base64,")
            const base64Data = base64.split(',')[1];
            resolve(base64Data);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
}

/**
 * Creates an extension that handles pasted images
 * Saves images to the configured attachments folder and inserts markdown link
 */
export function createImagePasteExtension(app: App): Extension {
    return EditorView.domEventHandlers({
        paste(event, view) {
            const clipboardData = event.clipboardData;
            if (!clipboardData) return false;

            // Check for image files in clipboard
            const items = Array.from(clipboardData.items);
            const imageItem = items.find((item) => item.type.startsWith('image/'));

            if (!imageItem) return false;

            const file = imageItem.getAsFile();
            if (!file) return false;

            event.preventDefault();

            // Handle async operation in a non-blocking way
            handleImagePaste(app, file, view).catch((error) => {
                console.error('Failed to paste image:', error);
            });

            return true;
        },
    });
}

/**
 * Handles the async image paste operation
 */
async function handleImagePaste(app: App, file: File, view: EditorView): Promise<void> {
    try {
        // Generate filename
        const filename = generateImageFilename(file.type);
        console.log('[ImagePaste] Generated filename:', filename);

        // Get the path where image should be saved
        const imagePath = await app.filesConfigManager.getNewAttachmentPath(filename);
        console.log('[ImagePaste] Image path:', imagePath);

        // Convert to base64 for saving via Tauri
        const base64Data = await blobToBase64(file);
        console.log('[ImagePaste] Base64 data length:', base64Data.length);

        // Save image using fileSystemManager
        await app.fileSystemManager.writeFileBinary(imagePath, base64Data);
        console.log('[ImagePaste] Image saved successfully');

        // Trigger file-create event to update file tree
        app.workspace._onFileCreate({
            path: imagePath,
            name: filename,
            extension: filename.split('.').pop() || '',
            stat: { mtime: Date.now(), ctime: Date.now(), size: base64Data.length },
            basename: filename.replace(/\.[^.]+$/, ''),
        });

        // Get relative path for markdown link
        const relativePath = await app.filesConfigManager.getAttachmentRelativePath(filename);
        console.log('[ImagePaste] Relative path:', relativePath);

        // Insert markdown image syntax
        const imageMarkdown = `![${filename}](${relativePath})`;

        const { from, to } = view.state.selection.main;
        view.dispatch({
            changes: { from, to, insert: imageMarkdown },
            selection: { anchor: from + imageMarkdown.length },
        });
        console.log('[ImagePaste] Markdown inserted:', imageMarkdown);
    } catch (error: any) {
        console.error('[ImagePaste] Failed to paste image:', error);
        throw error;
    }
}
