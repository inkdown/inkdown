import { useState } from "react";

interface TitleEditorProps {
  initialTitle: string,
  handleSaveNote: () => void,
  handleFocusEditor: () => void;
  handleChangeTitle: (newTitle: string) => void;
  sidebarState: 'expanded' | 'collapsed';
}

export const TitleEditor = ({ initialTitle, handleSaveNote, handleFocusEditor, handleChangeTitle, sidebarState }: TitleEditorProps) => {
  const [editingTitle, setEditingTitle] = useState(false);

  const onChangeTitle = (newTitle: string) => {
    const sanitized = newTitle.replace(/\n/g, "");

    handleSaveNote();
    handleChangeTitle(sanitized);
  };

  return (
     <div className={`w-full flex flex-col ml-4 items-center h-min`}>
      <input
        className="font-bold h-fit w-full caret-accent-foreground text-3xl text-theme-accent border-none outline-none focus:outline-none focus:ring-0 ring-0 resize-none"
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
    </div>
  )
}
