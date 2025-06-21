import {
  Sidebar,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarRail,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Notifications } from "./notifications";
import { notifications } from "@/data";
import { Link } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";
import { DirectoryTree } from "./directories/directory-tree";
import type { NotificationDataType } from "@/features/notification/types/notification-types";
import { SearchButton } from "@/components/search-button";
import { ArchivedNotes } from "./archived/archived-notes";
import { FilePlus, FolderPlus, Settings } from "lucide-react";
import { useEffect, useMemo } from "react";
import { NewNoteDirectoryContext } from "./new-note-directory-context";
import { useCreateDirectoryMutation, useDirectoriesWithChildrenQuery, useRenameDirectoryMutation } from "@/features/directories/queries/directory-query";

export const AppSidebar = () => {
  const { data, isLoading } = useDirectoriesWithChildrenQuery();
  
  const createDirectoryMutation = useCreateDirectoryMutation();
  const renameMutation = useRenameDirectoryMutation();

  const notesForSearch = useMemo(() => {
    if (!data) return [];
    return [
      ...data.notes.filter((n) => !n.archived),
      ...data.directories.flatMap((dir) => dir.notes)
    ];
  }, [data]);

  useEffect(() => {
    console.log(data);
  }, [data])

  return (
    <Sidebar>
      {isLoading && (
        <div className="space-y-2 w-full pt-20 flex items-center flex-col">
          <Skeleton className="h-6 w-[80%]" />
          <Skeleton className="h-6 w-[80%]" />
          <Skeleton className="h-6 w-[80%]" />
          <Skeleton className="h-6 w-[80%]" />
          <Skeleton className="h-6 w-[80%]" />
          <Skeleton className="h-6 w-[80%]" />
          <Skeleton className="h-6 w-[80%]" />
          <Skeleton className="h-6 w-[80%]" />
          <Skeleton className="h-6 w-[80%]" />
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
            <SearchButton notes={
              notesForSearch
            } />
            <span className="pl-2 list-none space-y-2">
              <Notifications notifications={notifications as NotificationDataType[]} />
              <ArchivedNotes data={data.notes.filter((n) => n.archived)} />
            </span>
          </SidebarHeader>
          <SidebarGroup className="h-full">
            <SidebarGroupContent className="h-full">
              <NewNoteDirectoryContext
                handleNewNote={() => {
                  data.notes.push({
                    title: "Sem titulo",
                    archived: false,
                    content: "",
                    createdAt: new Date().toString(),
                    directoryId: null,
                    type: "public",
                    id: ""
                  });
                }}
                handleNewDirectory={() => createDirectoryMutation.mutate({ title: "Sem titulo", parentId: null })}
              >
                {data.notes.length === 0 && data.directories.length === 0 ? (

                  <div className="w-full h-full flex-col pt-20 flex items-center space-y-3">
                    <span>
                      clique com o <span className="text-indigo-500">botão direito</span>
                    </span>
                    <span className="flex items-center space-x-2">
                      <FolderPlus size={20} /> <span>/</span> <FilePlus size={20} />
                    </span>
                  </div>
                ) : (
                  <DirectoryTree
                    directories={data.directories}
                    aloneNotes={data.notes}
                    onRenameDirectory={renameMutation.mutate}
                  />
                )}
              </NewNoteDirectoryContext>
            </SidebarGroupContent>
          </SidebarGroup>
        </>
      )}
      {/*       <SidebarFooter>
        <p>footer</p>
      </SidebarFooter> */}
      <SidebarRail />
    </Sidebar >
  );
};
