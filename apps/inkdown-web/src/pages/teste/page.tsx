import { useCallback, useState } from "react";
import { Editor } from "../notebook/components/editor/editor";
import Preview from "../notebook/components/editor/preview";

export default function TestPage() {
  const [content, setContent] = useState("");

  const handleContentChange = useCallback((newContent: string) => {
    setContent(newContent);
  }, []);

  return (
    <div className="flex w-full items-center justify-center">
      <Editor
      onChange={handleContentChange}
      initialDoc={content}
      />
      <Preview
      content={content}
      />
    </div>
  )
}