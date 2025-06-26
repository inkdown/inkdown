import { Skeleton } from "@/components/ui/skeleton";
import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { CircleDotIcon } from "lucide-react";
import { TitleEditor } from "./components/title-editor";
import { useNoteContentQuery, useUpdateNotaMutation } from "@/features/notes/queries/note-query";
import { Editor } from "./components/editor/editor";
import MarkdownPreview from "./components/editor/preview";
import { useSidebar } from "@/components/ui/sidebar";

export default function NotebookPage() {
  const [searchParams] = useSearchParams();
  const id = searchParams.get("id") ?? "";
  const { state } = useSidebar();
  const [previewMode, setPreviewMode] = useState(false);

  const { data, isLoading } = useNoteContentQuery(id);
  const updateNoteMutation = useUpdateNotaMutation();

  const [editingNote, setEditingNote] = useState(false);
  const [noteTitle, setNoteTitle] = useState("");
  const [noteContent, setNoteContent] = useState("");

  useEffect(() => {
    if (data) {
      setNoteTitle(data.title);
      setNoteContent(data.content);
    }
  }, [data]);

  useEffect(() => {
    const handleSave = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        setEditingNote(false);
        updateNoteMutation.mutate({ id, title: noteTitle, content: noteContent });
      }
    };

    document.addEventListener("keydown", handleSave);

    return () => {
      document.removeEventListener("keydown", handleSave);
    };
  }, [noteTitle, noteContent, id, updateNoteMutation]);

  const contentRef = useRef<HTMLTextAreaElement>(null);


  if (!data) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <h1 className="text-3xl font-bold">Nenhuma nota selecionada</h1>
      </div>
    )
  }


  return (
    <div className="flex-1 flex flex-col h-full">
      <span className="w-full flex justify-end">
        {editingNote && <CircleDotIcon size={15} />}
      </span>
      <div className="flex-1 flex flex-col pt-6 space-y-5">
        <TitleEditor
          sidebarState={state}
          handleChangeTitle={setNoteTitle}
          initialTitle={data.title}
          handleFocusEditor={() => contentRef.current?.focus()}
          handleSaveNote={() => setEditingNote(true)}
        />
        <div className="flex-1 flex flex-col md:flex-row">
          <div className={`${state === 'expanded' ? 'md:w-1/2' : 'md:w-1/2'} h-1/2 md:h-full border-r border-gray-200`}>
            <Editor
              content={data.content}
              onChange={(newContent) => setNoteContent(newContent)}
            />
          </div>
          <div className={`${state === 'expanded' ? 'md:w-1/2' : 'md:w-1/2'} h-1/2 md:h-full overflow-auto`}>
            <MarkdownPreview
              content={noteContent}
              theme="dracula"
              className="p-4"
            />
          </div>
        </div>
      </div>

      {isLoading && <Skeleton className="flex-1" />}
    </div>
  );
}
