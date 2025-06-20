import { useState } from "react";

interface TitleEditorProps {
  initialTitle: string,
  handleSaveNote: () => void,
  handleFocusEditor: () => void;
  handleChangeTitle: (newTitle: string) => void;
}

export const TitleEditor = ({ initialTitle, handleSaveNote, handleFocusEditor, handleChangeTitle }: TitleEditorProps) => {
  const [editingTitle, setEditingTitle] = useState(false);

  const onChangeTitle = (newTitle: string) => {
    const sanitized = newTitle.replace(/\n/g, "");

    handleSaveNote();
    handleChangeTitle(sanitized);
  };
  
  return (
    <textarea
      className="font-bold h-min w-full caret-accent-foreground text-3xl text-indigo-700 border-none outline-none focus:outline-none focus:ring-0 ring-0 resize-none"
      defaultValue={initialTitle}
      readOnly={!editingTitle}
      onClick={() => setEditingTitle(true)}
      onChange={(e) => onChangeTitle(e.currentTarget.value)}
      onBlur={(e) => {
        const actualText = e.currentTarget.value;

        if (actualText.trim() === "") {
          onChangeTitle("Sem titulo");
        }
      }}
      onKeyUp={(e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          setEditingTitle(false);
          handleFocusEditor();
        }
      }}
    />
  )
}