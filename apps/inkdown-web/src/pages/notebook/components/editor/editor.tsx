import CodeMirror, { type Extension, type ViewUpdate } from "@uiw/react-codemirror";
import { markdown, markdownLanguage } from "@codemirror/lang-markdown";
import { vim } from "@replit/codemirror-vim"
import { markdownLineStyler } from "./editor-style-liner.ts"
import "./editor.css"
import { getEditorSettings } from "@/features/settings/services/settings-service.ts";
import React from "react";
import { EditorView } from "@codemirror/view";

interface EditorProps {
  content: string,
  onChange: (content: string, view: ViewUpdate) => void;
}

export const Editor = React.forwardRef<any, EditorProps>(({ content, onChange }, ref) => {
  const userEditor = getEditorSettings();

  const extensions: Extension[] = [markdown({base: markdownLanguage}), EditorView.lineWrapping];

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
    <div className='w-full h-full border-none prose outline-none'>
      <CodeMirror
        ref={ref}
        value={content}
        height="100%"
        extensions={extensions}
        onChange={onChange}
        basicSetup={basicSetup}
      />
    </div>
  );
});