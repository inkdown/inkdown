import { type Extension, StateField, EditorState, Range } from "@codemirror/state";
import { Decoration, EditorView, type DecorationSet } from "@codemirror/view";
import { syntaxTree } from "@codemirror/language";

export const markdownLineStyler = (): Extension => {
  const markdownLineStylerField = StateField.define<DecorationSet>({
    create(state: EditorState): DecorationSet {
      return createDecorations(state);
    },
    update(oldDeco, tr) {
      if (tr.docChanged || tr.selection) {
        return createDecorations(tr.state);
      }
      return oldDeco;
    },
    provide: f => EditorView.decorations.from(f)
  });

  return markdownLineStylerField;
};

const createDecorations = (state: EditorState): DecorationSet => {
  const widgets: Range<Decoration>[] = [];
  const tree = syntaxTree(state);

  tree.iterate({
    enter(node) {
      try {
        const line = state.doc.lineAt(node.from);
        
        if (node.name === "ATXHeading1") {
          widgets.push(createLineDecoration(line.from, "cm-h1"));
        } else if (node.name === "ATXHeading2") {
          widgets.push(createLineDecoration(line.from, "cm-h2"));
        } else if (node.name === "ATXHeading3") {
          widgets.push(createLineDecoration(line.from, "cm-h3"));
        }
        
        else if (node.name === "FencedCode") {
          const startLine = state.doc.lineAt(node.from);
          widgets.push(createLineDecoration(startLine.from, "cm-code-start"));
          
          const endLine = state.doc.lineAt(node.to);
          widgets.push(createLineDecoration(endLine.from, "cm-code-end"));
        }

        else if (node.name === "ListItem") {
          widgets.push(createLineDecoration(line.from, "cm-list-item"));
        }
      } catch (e) {
        console.warn("Error processing node:", e);
      }
    }
  });

  return Decoration.set(widgets);
};

const createLineDecoration = (pos: number, className: string) => {
  return Decoration.line({ class: className }).range(pos);
};