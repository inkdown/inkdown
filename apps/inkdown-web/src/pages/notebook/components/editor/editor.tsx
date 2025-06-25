import CodeMirror, { type ViewUpdate } from "@uiw/react-codemirror";
import { markdown, markdownLanguage } from "@codemirror/lang-markdown";
import { solarizedLight } from "@uiw/codemirror-theme-solarized"
import { vim } from "@replit/codemirror-vim"
import { markdownLineStyler } from "./editor-style-liner.ts"
import "./editor.css"

interface EditorProps {
  content: string,
  onChange: (content: string, view: ViewUpdate) => void;
}

export function Editor({ content, onChange }: EditorProps) {
  return (
    <div className='w-full h-full prose'> {/* Removido height fixo */}
      <CodeMirror
        value={content}
        height="100%"
        theme={solarizedLight}
        extensions={[
          markdown({
            base: markdownLanguage,
          }),
          markdownLineStyler(),
          vim()
        ]}
        onChange={onChange}
        basicSetup={{
          syntaxHighlighting: true,
          lineNumbers: true,
          highlightActiveLine: true,
          bracketMatching: true,
          autocompletion: true,
          highlightSelectionMatches: true,
        }}
      />
    </div>
  );
}
