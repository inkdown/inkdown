import { Skeleton } from "@/components/ui/skeleton";
import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { BookOpen, CircleDotIcon, Columns2, PenLine } from "lucide-react";
import { TitleEditor } from "./components/title-editor";
import { useNoteContentQuery, useUpdateNotaMutation } from "@/features/notes/queries/note-query";
import { Editor } from "./components/editor/editor";
import MarkdownPreview from "./components/editor/preview";
import { useSidebar } from "@/components/ui/sidebar";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { MarkdownToolbar } from "./components/markdown-toolbar";

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
     console.log("Ao");
  }

  useEffect(() => {
    if (data) {
      setNoteTitle(data.note.title);
      setNoteContent(data.note.content);
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

    const handleTogglePreview = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "p") {
        e.preventDefault();
        
        const isInPreviewMode = mode.preview;

        setMode({
          divided: false,
          editor: isInPreviewMode,
          preview: !isInPreviewMode,
        });
      }
    };

    document.addEventListener("keydown", handleSave);
    document.addEventListener("keydown", handleTogglePreview);

    return () => {
      document.removeEventListener("keydown", handleSave);
      document.removeEventListener("keydown", handleTogglePreview);
    };
  }, [noteTitle, noteContent, id, updateNoteMutation]);

  const contentRef = useRef<HTMLTextAreaElement>(null);
  const editorRef = useRef<any>(null);


  if (!data) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <h1 className="text-3xl font-bold">Nenhuma nota selecionada</h1>
      </div>
    )
  }


  return (
    <div className="flex-1 flex flex-col h-full overflow-x-hidden">
      <div className="flex-1  ml-4 flex flex-col pt-6 space-y-5">
        <div className="w-full flex items-center">
          <div className="flex items-center w-full gap-2 px-4">
            {data.Directory && (
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem className="hidden md:block">
                    <BreadcrumbLink href="#">{data.Directory.parent && data.Directory.parent.title}</BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator className="hidden md:block" />
                  <BreadcrumbItem>
                    <BreadcrumbPage>{data.Directory.title}</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            )}
          </div>
          <button className="w-full flex justify-end mr-20 hover:cursor-pointer" onClick={handleModeChange}>
            {mode.divided && <Columns2 size={20} />}
            {mode.preview && <BookOpen size={20} />}
            {mode.editor && <PenLine size={20} />}
          </button>
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
        <span className="ml-4">
          {editingNote && <CircleDotIcon size={20} />}
        </span>
        <div className="flex-1 flex flex-col md:flex-row">
          {mode.divided && (
            <>
              <div className={`${state === 'expanded' ? 'md:w-1/2' : 'md:w-1/2'} h-1/2 md:h-full border-r border-gray-200`}>
                <Editor
                  ref={editorRef}
                  content={data.note.content}
                  onChange={(newContent) => {
                    setNoteContent(newContent);
                    setEditingNote(true);
                  }}
                />
              </div>
              <div className={`${state === 'expanded' ? 'md:w-1/2' : 'md:w-1/2'} h-1/2 md:h-full overflow-auto`}>
                <MarkdownPreview
                  content={noteContent}
                  className="p-4"
                />
              </div>
            </>
          )}
          {mode.preview && (
            <div className="w-full h-full">
              <MarkdownPreview
                content={noteContent}
              />
            </div>
          )}
          {mode.editor && (
            <div className={`w-full max-w-full h-1/2 md:h-full border-r border-gray-200`}>
              <Editor
                ref={editorRef}
                content={data.note.content}
                onChange={(newContent) => {
                  setNoteContent(newContent);
                  setEditingNote(true);
                }}
              />
            </div>
          )}

        </div>
      </div>

      {isLoading && <Skeleton className="flex-1" />}
    </div>
  );
}
