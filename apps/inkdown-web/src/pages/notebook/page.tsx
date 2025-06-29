import { Skeleton } from "@/components/ui/skeleton";
import { useEffect, useRef, useState, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { BookOpen, CircleDotIcon, Columns2, PenLine } from "lucide-react";
import { TitleEditor } from "./components/title-editor";
import { useNoteContentQuery, useUpdateNotaMutation } from "@/features/notes/queries/note-query";
import { Editor } from "./components/editor/editor";
import MarkdownPreview from "./components/editor/preview";
import { useSidebar } from "@/components/ui/sidebar";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { MarkdownToolbar } from "./components/markdown-toolbar";
import { NoteOptions } from "./components/note-options";

export default function NotebookPage() {
  const [searchParams] = useSearchParams();
  const id = searchParams.get("id") ?? "";
  const { state } = useSidebar();

  const defaultMode = {
    preview: false,
    divided: true,
    editor: false,
  };

  const [mode, setMode] = useState(defaultMode);
  const { data, isLoading } = useNoteContentQuery(id);
  const updateNoteMutation = useUpdateNotaMutation();

  const [editingNote, setEditingNote] = useState(false);
  const [noteTitle, setNoteTitle] = useState("");
  const [noteContent, setNoteContent] = useState("");

  const handleModeChange = () => {
    console.log("Mode changed");
  };

  useEffect(() => {
    if (data) {
      setNoteTitle(data.note.title);
      setNoteContent(data.note.content);
    };

  }, [data]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.ctrlKey || e.metaKey) {
      switch (e.key.toLowerCase()) {
        case 's':
          e.preventDefault();
          setEditingNote(false);
          updateNoteMutation.mutate({ id, title: noteTitle, content: noteContent });
          break;
        case 'p':
          e.preventDefault();
          setMode(prev => ({ divided: false, editor: prev.preview, preview: !prev.preview }));
          break;
        case 'i':
          e.preventDefault();
          setMode({ divided: true, preview: false, editor: false });
          break;
        default:
          break;
      }
    }
  }, [id, noteTitle, noteContent, updateNoteMutation, mode]);

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleKeyDown]);

  const contentRef = useRef<HTMLTextAreaElement>(null);
  const editorRef = useRef<any>(null);

  if (!data) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <h1 className="text-3xl font-bold">Nenhuma nota selecionada</h1>
      </div>
    );
  }

  const editorAndPreviewClassName = `${state === 'expanded' ? 'md:w-1/2' : 'md:w-1/2'} h-1/2 md:h-full`;

  return (
    <div className="flex-1 flex flex-col h-full overflow-x-hidden">
      <div className="flex-1 ml-4 flex flex-col pt-6 space-y-5">
        <div className="w-full flex items-center">
          <div className="flex items-center w-full gap-2 px-4">
            {data.note.Directory && (
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem className="hidden md:block">
                    <BreadcrumbLink href="#">{data.note.Directory.parent && data.note.Directory.parent.title}</BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator className="hidden md:block" />
                  <BreadcrumbItem>
                    <BreadcrumbPage>{data.note.Directory.title}</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            )}
          </div>
          <div className="w-full space-x-8 flex items-center justify-end">
            <span>
              {editingNote && <CircleDotIcon size={15} />}
            </span>
            <button className="hover:cursor-pointer" onClick={handleModeChange}>
              {mode.divided && <Columns2 size={20} />}
              {mode.preview && <BookOpen size={20} />}
              {mode.editor && <PenLine size={20} />}
            </button>
            <NoteOptions noteId={data.note.id} />
          </div>
        </div>
        <TitleEditor
          sidebarState={state}
          handleChangeTitle={setNoteTitle}
          initialTitle={data.note.title}
          handleFocusEditor={() => contentRef.current?.focus()}
          handleSaveNote={() => setEditingNote(true)}
        />
        <MarkdownToolbar
          editorRef={editorRef}
          noteContent={noteContent}
          setNoteContent={setNoteContent}
        />
        <div className="flex-1 flex flex-col md:flex-row">
          {(mode.divided || mode.editor) && (
            <div className={`${editorAndPreviewClassName} ${mode.editor ? 'w-full' : 'border-r border-gray-200'}`}>
              <Editor
                ref={editorRef}
                content={noteContent}
                onChange={(newContent) => {
                  setNoteContent(newContent);
                  setEditingNote(true);
                }}
              />
            </div>
          )}
          {(mode.divided || mode.preview) && (
            <div className={`${editorAndPreviewClassName} ${mode.preview ? 'w-full' : 'overflow-auto'}`}>
              <MarkdownPreview
                content={noteContent}
                className={mode.divided ? "p-4" : ""}
              />
            </div>
          )}
        </div>
      </div>
      {isLoading && <Skeleton className="flex-1" />}
    </div>
  );
}
