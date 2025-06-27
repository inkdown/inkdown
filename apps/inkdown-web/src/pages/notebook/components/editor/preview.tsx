import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import remarkGfm from "remark-gfm";
import "./preview.css";

interface PreviewProps {
  content: string;
  className?: string;
}

const MarkdownPreview = ({
  content,
  className = ""
}: PreviewProps) => {
  return (
    <div className={`preview-container w-full h-full overflow-auto ${className}`}>
      <div className="max-w-4xl mx-auto p-4 markdown-body">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            code({ className, children }) {
              const match = /language-(\w+)/.exec(className || "");

              return match ? (
                <div className="code-block my-4">
                  <SyntaxHighlighter
                    language={match[1]}
                  >
                    {String(children).replace(/\n$/, "")}
                  </SyntaxHighlighter>
                </div>
              ) : (
                <code className={`${className}`}>
                  {children}
                </code>
              );
            },
            table({ children }) {
              return (
                <div className="table-container overflow-x-auto my-4">
                  <table className="min-w-full border-collapse">
                    {children}
                  </table>
                </div>
              )
            },
            img({ src, alt, title }) {
              return (
                <div className="image-container my-4">
                  <img
                    src={src}
                    alt={alt}
                    title={title}
                    loading="lazy"
                    className="max-w-full rounded-lg shadow-md"
                  />
                </div>
              )
            },
            blockquote({ children }) {
              return (
                <blockquote className="custom-blockquote">
                  {children}
                </blockquote>
              )
            },
            h1({ children }) {
              return <h1 className="text-4xl font-bold my-4">{children}</h1>
            },
            h2({ children }) {
              return <h2 className="text-2xl font-bold my-3">{children}</h2>
            },
            h3({ children }) {
              return <h3 className="text-xl font-bold my-2">{children}</h3>
            },
            p({ children }) {
              return <p>{children}</p>
            },
            ul({ children }) {
              return <ul>{children}</ul>
            },
            ol({ children }) {
              return <ol>{children}</ol>
            },
            li({ children }) {
              return <li>{children}</li>
            }
          }}
        >
          {content.replace(/\n/g, '  \n')}
        </ReactMarkdown>
      </div>
    </div>
  );
};

export default MarkdownPreview;