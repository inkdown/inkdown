import {
  Sidebar,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarRail,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Link } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";
import { DirectoryTree } from "./directories/directory-tree";
import { SearchButton } from "@/components/search-button";
import { ArchivedNotes } from "./archived/archived-notes";
import { FilePlus, FolderPlus, Settings } from "lucide-react";
import { useMemo } from "react";
import { NewNoteDirectoryContext } from "./new-note-directory-context";
import { useCreateDirectoryMutation, useDirectoriesWithChildrenQuery } from "@/features/directories/queries/directory-query";
import { useCreateNoteMutation, useArchiveNoteMutation } from "@/features/notes/queries/note-query";
import type { DirectoryWithChildren } from "@/features/directories/types/directory-types";
import type { NoteDataType } from "@/features/notes/types/note-types";

export const AppSidebar = () => {
  const { data, isLoading } = useDirectoriesWithChildrenQuery();

  const createNoteMutation = useCreateNoteMutation();
  const createDirectoryMutation = useCreateDirectoryMutation();
  const archiveNoteMutation = useArchiveNoteMutation();

  const getAllNotesFromDirectories = (directories: DirectoryWithChildren[]): NoteDataType[] => {
    let notes: NoteDataType[] = [];
    for (const directory of directories) {
      notes = notes.concat(directory.notes);
      if (directory.childrens && directory.childrens.length > 0) {
        notes = notes.concat(getAllNotesFromDirectories(directory.childrens));
      }
    }
    return notes;
  };

  const notesForSearch = useMemo(() => {
    if (!data) return [];

    const allNotes = [
      ...data.notes,
      ...getAllNotesFromDirectories(data.directories)
    ];

    return allNotes.filter((note) => !note.archived);
  }, [data]);

  const archivedNotes = useMemo(() => {
    if (!data) return [];

    const allNotes = [
      ...data.notes,
      ...getAllNotesFromDirectories(data.directories)
    ];

    return allNotes.filter((note) => note.archived);
  }, [data]);


  return (
    <Sidebar>
      {isLoading && (
        <div className="space-y-2 w-full pt-20 flex items-center flex-col">
          {Array.from({ length: 9 }).map((_, index) => (
            <Skeleton key={index} className="h-6 w-[80%]" />
          ))}
        </div>
      )}
      {data && (
        <>
          <SidebarHeader className="pt-5 space-y-2">
            <div className="flex space-x-2 items-center">
              <SidebarTrigger className="w-8 h-8" />
              <Link to={"/settings?option=Editor"} className={"flex items-center"}>
                <Settings size={18} />
              </Link>
            </div>
            <SearchButton notes={notesForSearch} />
            <span className="pl-2 list-none space-y-2">
              <ArchivedNotes data={archivedNotes} />
            </span>
          </SidebarHeader>
          <SidebarGroup className="h-full">
            <SidebarGroupContent className="h-full">
              <NewNoteDirectoryContext
                handleNewNote={() => createNoteMutation.mutate(null)}
                handleNewDirectory={() => createDirectoryMutation.mutate({ title: "Sem titulo", parentId: null })}
              >
                {notesForSearch.length === 0 && archivedNotes.length === 0 ? (
                  <div className="w-full h-full flex-col pt-20 flex items-center space-y-3">
                    <span>
                      clique com o <span className="text-theme-accent">botão direito</span>
                    </span>
                    <span className="flex items-center space-x-2">
                      <FolderPlus size={20} /> <span>/</span> <FilePlus size={20} />
                    </span>
                  </div>
                ) : (
                  <DirectoryTree
                    directories={data.directories}
                    aloneNotes={data.notes.filter(note => !note.directoryId && !note.archived)}
                    onCreateNote={(parentId: number | null) => createNoteMutation.mutate(parentId)}
                    onCreateDirectory={(parentId: number | null) => createDirectoryMutation.mutate({ parentId, title: "Sem titulo" })}
                    onArchiveNote={(noteId: string) => archiveNoteMutation.mutate(noteId)}
                  />
                )}
              </NewNoteDirectoryContext>
            </SidebarGroupContent>
          </SidebarGroup>
        </>
      )}
      <SidebarRail />
    </Sidebar >
  );
};
