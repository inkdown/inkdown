/**
 * Parse frontmatter from markdown content
 */
export function parseFrontMatter(content: string): {
    frontmatter: Record<string, any>;
    body: string;
} {
    const frontmatterRegex = /^---\n([\s\S]*?)\n---\n/;
    const match = content.match(frontmatterRegex);

    if (!match) {
        return {
            frontmatter: {},
            body: content,
        };
    }

    const frontmatterText = match[1];
    const body = content.slice(match[0].length);

    // Simple YAML parsing (basic key: value pairs)
    const frontmatter: Record<string, any> = {};
    const lines = frontmatterText.split('\n');

    for (const line of lines) {
        const colonIndex = line.indexOf(':');
        if (colonIndex === -1) continue;

        const key = line.slice(0, colonIndex).trim();
        const value = line.slice(colonIndex + 1).trim();

        // Remove quotes if present
        const unquoted = value.replace(/^["'](.*)["']$/, '$1');

        // Try to parse as number or boolean
        if (unquoted === 'true') {
            frontmatter[key] = true;
        } else if (unquoted === 'false') {
            frontmatter[key] = false;
        } else if (!isNaN(Number(unquoted)) && unquoted !== '') {
            frontmatter[key] = Number(unquoted);
        } else {
            frontmatter[key] = unquoted;
        }
    }

    return { frontmatter, body };
}

/**
 * Get frontmatter info (existence, position)
 */
export function getFrontMatterInfo(content: string): {
    exists: boolean;
    frontmatter: string;
    from: number;
    to: number;
    contentStart: number;
} {
    const frontmatterRegex = /^---\n([\s\S]*?)\n---\n/;
    const match = content.match(frontmatterRegex);

    if (!match) {
        return {
            exists: false,
            frontmatter: '',
            from: 0,
            to: 0,
            contentStart: 0,
        };
    }

    const frontmatter = match[1];
    const from = 4; // After '---\n'
    const to = from + frontmatter.length;
    const contentStart = match[0].length;

    return {
        exists: true,
        frontmatter,
        from,
        to,
        contentStart,
    };
}
