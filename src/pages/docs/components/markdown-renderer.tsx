import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import rehypeRaw from 'rehype-raw';
import '../../../styles/syntax-highlight.css';

interface MarkdownRendererProps {
  content: string;
}

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
  return (
    <div className="markdown-content">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw, rehypeHighlight]}
        components={{
          // Customização de componentes
          h1: ({ children, ...props }) => (
            <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 via-indigo-900 to-slate-900 dark:from-white dark:via-indigo-300 dark:to-white bg-clip-text text-transparent mb-6 mt-8 pb-3 border-b-2 border-gradient-to-r border-indigo-500/30" {...props}>
              {children}
            </h1>
          ),
          h2: ({ children, ...props }) => (
            <h2 className="text-2xl font-semibold text-slate-900 dark:text-white mb-4 mt-8 flex items-center gap-3" {...props}>
              <span className="w-1 h-6 bg-gradient-to-b from-indigo-500 to-purple-600 rounded-full"></span>
              {children}
            </h2>
          ),
          h3: ({ children, ...props }) => (
            <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-3 mt-6 flex items-center gap-2" {...props}>
              <span className="w-1 h-4 bg-gradient-to-b from-indigo-400 to-purple-500 rounded-full"></span>
              {children}
            </h3>
          ),
          h4: ({ children, ...props }) => (
            <h4 className="text-lg font-semibold text-slate-900 dark:text-white mb-2 mt-4" {...props}>
              {children}
            </h4>
          ),
          p: ({ children, ...props }) => (
            <p className="text-slate-700 dark:text-slate-300 leading-7 mb-4" {...props}>
              {children}
            </p>
          ),
          ul: ({ children, ...props }) => (
            <ul className="list-disc list-inside space-y-2 mb-4 text-slate-700 dark:text-slate-300" {...props}>
              {children}
            </ul>
          ),
          ol: ({ children, ...props }) => (
            <ol className="list-decimal list-inside space-y-2 mb-4 text-slate-700 dark:text-slate-300" {...props}>
              {children}
            </ol>
          ),
          li: ({ children, ...props }) => (
            <li className="text-slate-700 dark:text-slate-300" {...props}>
              {children}
            </li>
          ),
          blockquote: ({ children, ...props }) => (
            <blockquote className="relative border-l-4 border-gradient-to-b from-indigo-500 to-purple-600 pl-6 py-4 my-6 bg-gradient-to-r from-indigo-50/50 to-purple-50/50 dark:from-indigo-950/30 dark:to-purple-950/30 rounded-r-xl backdrop-blur-sm border-r border-t border-b border-indigo-200/50 dark:border-indigo-800/50" {...props}>
              <div className="absolute left-2 top-4 w-1 h-1 bg-indigo-500 rounded-full"></div>
              <div className="text-slate-800 dark:text-slate-200 italic font-medium leading-relaxed">
                {children}
              </div>
            </blockquote>
          ),
          code: ({ inline, className, children, ...props }: any) => {
            if (inline) {
              return (
                <code className="px-2 py-1 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/50 dark:to-purple-950/50 text-indigo-900 dark:text-indigo-300 rounded-md text-sm font-mono border border-indigo-200/50 dark:border-indigo-800/50" {...props}>
                  {children}
                </code>
              );
            }
            return (
              <code className={`${className} text-sm`} {...props}>
                {children}
              </code>
            );
          },
          pre: ({ children, ...props }) => {
            // Extract code content for copy functionality
            const child = children as any;
            const code = child?.props?.children || '';

            return (
              <div className="code-block-container group">
                <pre {...props}>
                  {children}
                </pre>
                <button 
                  className="copy-button opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                  onClick={() => {
                    if (typeof code === 'string') {
                      navigator.clipboard.writeText(code);
                    }
                  }}
                  title="Copiar código"
                >
                  Copy
                </button>
              </div>
            );
          },
          a: ({ children, href, ...props }) => (
            <a 
              href={href} 
              className="relative text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 font-medium transition-all duration-200 hover:underline decoration-2 underline-offset-4 decoration-indigo-500/50 group"
              target={href?.startsWith('http') ? '_blank' : undefined}
              rel={href?.startsWith('http') ? 'noopener noreferrer' : undefined}
              {...props}
            >
              {children}
              {href?.startsWith('http') && (
                <span className="inline-block ml-1 opacity-60 group-hover:opacity-100 transition-opacity">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4.25 5.5a.75.75 0 00-.75.75v8.5c0 .414.336.75.75.75h8.5a.75.75 0 00.75-.75v-4a.75.75 0 011.5 0v4A2.25 2.25 0 0112.75 17h-8.5A2.25 2.25 0 012 14.75v-8.5A2.25 2.25 0 014.25 4h5a.75.75 0 010 1.5h-5z" clipRule="evenodd" />
                    <path fillRule="evenodd" d="M6.194 12.753a.75.75 0 001.06.053L16.5 4.44v2.81a.75.75 0 001.5 0v-4.5a.75.75 0 00-.75-.75h-4.5a.75.75 0 000 1.5h2.553l-9.056 8.194a.75.75 0 00-.053 1.06z" clipRule="evenodd" />
                  </svg>
                </span>
              )}
            </a>
          ),
          img: ({ src, alt, ...props }) => (
            <img 
              src={src} 
              alt={alt} 
              className="max-w-full h-auto rounded-lg shadow-md mb-4 border border-slate-200 dark:border-slate-700"
              {...props}
            />
          ),
          table: ({ children, ...props }) => (
            <div className="overflow-x-auto mb-4">
              <table className="min-w-full border border-slate-200 dark:border-slate-700 rounded-lg" {...props}>
                {children}
              </table>
            </div>
          ),
          thead: ({ children, ...props }) => (
            <thead className="bg-slate-50 dark:bg-slate-800" {...props}>
              {children}
            </thead>
          ),
          tbody: ({ children, ...props }) => (
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700" {...props}>
              {children}
            </tbody>
          ),
          tr: ({ children, ...props }) => (
            <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors" {...props}>
              {children}
            </tr>
          ),
          th: ({ children, ...props }) => (
            <th className="px-4 py-3 text-left text-sm font-semibold text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-700" {...props}>
              {children}
            </th>
          ),
          td: ({ children, ...props }) => (
            <td className="px-4 py-3 text-sm text-slate-700 dark:text-slate-300" {...props}>
              {children}
            </td>
          ),
          hr: ({ ...props }) => (
            <hr className="border-slate-200 dark:border-slate-700 my-8" {...props} />
          ),
          strong: ({ children, ...props }) => (
            <strong className="font-semibold text-slate-900 dark:text-white" {...props}>
              {children}
            </strong>
          ),
          em: ({ children, ...props }) => (
            <em className="italic text-slate-800 dark:text-slate-200" {...props}>
              {children}
            </em>
          )
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};

export default MarkdownRenderer;
