import type React from 'react';
import ReactMarkdown, { type Components } from 'react-markdown';
import rehypeHighlight from 'rehype-highlight';
import rehypeKatex from 'rehype-katex';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import 'katex/dist/katex.min.css';
import 'highlight.js/styles/github-dark.css';
import './Preview.css';

export interface PreviewProps {
    content: string;
    mode: 'side-by-side' | 'preview-only';
}

/**
 * Preview Component - Renders markdown content with syntax highlighting and math
 */
export const Preview: React.FC<PreviewProps> = ({ content, mode }) => {
    const components: Components = {
        // Custom renderers for better styling
        h1: ({ ...props }) => <h1 className="preview-h1" {...props} />,
        h2: ({ ...props }) => <h2 className="preview-h2" {...props} />,
        h3: ({ ...props }) => <h3 className="preview-h3" {...props} />,
        h4: ({ ...props }) => <h4 className="preview-h4" {...props} />,
        h5: ({ ...props }) => <h5 className="preview-h5" {...props} />,
        h6: ({ ...props }) => <h6 className="preview-h6" {...props} />,
        code: ({ className, children, ...props }) => {
            const match = /language-(\w+)/.exec(className || '');
            const isInline = !match;

            if (isInline) {
                return (
                    <code className="preview-inline-code" {...props}>
                        {children}
                    </code>
                );
            }
            return (
                <code className={className} {...props}>
                    {children}
                </code>
            );
        },
        pre: ({ ...props }) => <pre className="preview-code-block" {...props} />,
        blockquote: ({ ...props }) => <blockquote className="preview-quote" {...props} />,
        a: ({ ...props }) => <a className="preview-link" {...props} />,
        table: ({ ...props }) => <table className="preview-table" {...props} />,
        img: ({ alt, ...props }) => <img alt={alt || ''} className="preview-image" {...props} />,
    };

    return (
        <div className={`preview-container preview-${mode}`}>
            <div className="preview-content">
                <ReactMarkdown
                    remarkPlugins={[remarkGfm, remarkMath]}
                    rehypePlugins={[rehypeKatex, rehypeHighlight]}
                    components={components}
                >
                    {content}
                </ReactMarkdown>
            </div>
        </div>
    );
};
