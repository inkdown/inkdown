import ReactMarkdown from 'react-markdown';
import 'github-markdown-css/github-markdown.css'
import remarkGfm from "remark-gfm"

const Preview = ({ content }: { content: string }) => {
  return (
    <div>
      <div className='prose'>
        <ReactMarkdown rehypePlugins={[remarkGfm]}>{content}</ReactMarkdown>
      </div>
    </div>
  );
}

export default Preview;