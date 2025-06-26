import CodeMirror, { type Extension, type ViewUpdate } from "@uiw/react-codemirror";
import { markdown, markdownLanguage } from "@codemirror/lang-markdown";
import { solarizedLight } from "@uiw/codemirror-theme-solarized"
import { vim } from "@replit/codemirror-vim"
import { markdownLineStyler } from "./editor-style-liner.ts"
import "./editor.css"
import { getEditorSettings } from "@/features/settings/services/settings-service.ts";

interface EditorProps {
  content: string,
  onChange: (content: string, view: ViewUpdate) => void;
}

export function Editor({ content, onChange }: EditorProps) {
  const userEditor = getEditorSettings();

  const extensions: Extension[] = [markdown({base: markdownLanguage})];

  if (userEditor.markdownLineStyler) {
    extensions.push(markdownLineStyler());
  };

  if (userEditor.vimMode) {
    extensions.push(vim());
  }

  const basicSetup = {
    syntaxHighlighting: userEditor.syntaxHighlighting,
    lineNumbers: userEditor.lineNumbers,
    highlightActiveLine: userEditor.hightlightActiveLine,
    bracketMatching: userEditor.bracketMathing,
    autocompletion: userEditor.autocompletion,
    highlightSelectionMatches: userEditor.hightlightSelectionMatches,
  }

  return (
    <div className='w-full h-full prose'>
      <CodeMirror
        value={content}
        height="100%"
        theme={solarizedLight}
        extensions={extensions}
        onChange={onChange}
        basicSetup={basicSetup}
      />
    </div>
  );
}
