import React from "react";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import type { SyntaxHighlighterProps } from "react-syntax-highlighter";
import remarkGfm from "remark-gfm";
import "./preview.css";

export type PreviewTheme =
  | "github-light"
  | "github-dark"
  | "dracula"
  | "solarized-light"
  | "solarized-dark"
  | "material"
  | "nord"
  | "monokai"
  | "tokyo-night"
  | "tokyo-night-storm"
  | "aura"
  | "base2tone-forest";

interface PreviewProps {
  content: string;
  theme?: PreviewTheme;
  className?: string;
}

const CustomSyntaxHighlighter: React.FC<SyntaxHighlighterProps> = (props) => (
  <SyntaxHighlighter
    {...props}
    PreTag="div"
    className="syntax-highlighter"
    customStyle={{
      margin: 0,
      padding: "1.25rem",
      borderRadius: "8px",
      fontSize: "0.95rem",
    }}
  />
);

const MarkdownPreview = ({
  content,
  theme = "dracula",
  className = ""
}: PreviewProps) => {
  return (
    <div className={`preview-container w-full h-full ${theme} overflow-auto ${className}`}>
      <div className="max-w-4xl mx-auto p-4">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            code({ className, children }) {
              const match = /language-(\w+)/.exec(className || "");

              return match ? (
                <div className="code-block my-4">
                  <CustomSyntaxHighlighter
                    language={match[1]}
                  >
                    {String(children).replace(/\n$/, "")}
                  </CustomSyntaxHighlighter>
                </div>
              ) : (
                <code className={`${className} bg-gray-100 px-1 rounded`}>
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
                <blockquote className="custom-blockquote border-l-4 border-gray-400 pl-4 my-4 italic text-gray-600">
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
              return <p className="my-3 leading-relaxed">{children}</p>
            },
            ul({ children }) {
              return <ul className="list-disc pl-6 my-3">{children}</ul>
            },
            ol({ children }) {
              return <ol className="list-decimal pl-6 my-3">{children}</ol>
            },
            li({ children }) {
              return <li className="my-1">{children}</li>
            }
          }}
        >
          {content}
        </ReactMarkdown>
      </div>
    </div>
  );
};

export default MarkdownPreview;
