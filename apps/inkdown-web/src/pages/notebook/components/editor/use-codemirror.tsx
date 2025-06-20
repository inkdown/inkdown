import { useEffect, useState, useRef } from "react"
import { EditorState } from "@codemirror/state"
import { EditorView, keymap, highlightActiveLine, lineNumbers, highlightActiveLineGutter } from "@codemirror/view"
import { defaultKeymap, history, historyKeymap, indentWithTab } from "@codemirror/commands"
import { indentOnInput, bracketMatching, defaultHighlightStyle, HighlightStyle } from "@codemirror/language"
import { markdown, markdownLanguage } from "@codemirror/lang-markdown"
import { tags } from "@lezer/highlight";
import { solarizedDark } from "cm6-theme-solarized-dark"

import type React from "react"

export const transparentTheme = EditorView.theme({
  "&": {
    backgroundcolor: "transparent !important",
    height: "100%"
  }
})

const syntaxHighlighting = HighlightStyle.define([
  {
    tag: tags.heading1,
    fontSize: "1.6em",
    fontWeight: "bold"
  },
  {
    tag: tags.heading2,
    fontSize: "1.4em",
    fontWeight: "bold"
  },
  {
    tag: tags.heading3,
    fontSize: "1.2em",
    fontWeight: "bold"
  }
])

interface Props {
  initialDoc: string,
  onChange?: (state: EditorState) => void
}

const useCodeMirror = <T extends Element>(
  props: Props
): [React.MutableRefObject<T | null>, EditorView?] => {
  const refContainer = useRef<T>(null)
  const [editorView, setEditorView] = useState<EditorView>();
  const [vimMode, setVimMode] = useState(false);

  const { onChange } = props

  useEffect(() => {
    if (!refContainer.current) return

    const startState = EditorState.create({
      doc: props.initialDoc,
      extensions: [
        lineNumbers(),
        highlightActiveLineGutter(),
        history(),
        indentOnInput(),
        bracketMatching(),
        highlightActiveLine(),
        markdown({
          base: markdownLanguage,
          addKeymap: true
        }),
        solarizedDark,
        EditorView.lineWrapping,
        EditorView.updateListener.of(update => {
          if (update.changes) {
            onChange?.(update.state)
          }
        })
      ]
    });

    const view = new EditorView({
      state: startState,
      parent: refContainer.current,
    });

    setEditorView(view)

    return () => {
      view.destroy()
    }
  }, [refContainer])

  return [refContainer, setVimMode]
}

export default useCodeMirror
