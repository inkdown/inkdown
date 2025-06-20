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
import { UserNav } from "./user-nav";
import { useQuery } from "@tanstack/react-query";
import { getAuthorDirectoriesWithChildrenNotes, updateDirectoryTitle } from "@/features/notes/services/note-service";
import { notifications } from "@/data";
import { Link } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";
import { DirectoryTree } from "./directories/directory-tree";
import type { DirectoryWithChildren } from "@/features/notes/types/directory-types";
import type { NotificationDataType } from "@/features/notification/types/notification-types";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { renameDirectory } from "@/features/notes/services/note-service";
import type { NoteDataType } from "@/features/notes/types/note-types";
import { SearchButton } from "@/components/search-button";
import { ArchivedNotes } from "./archived/archived-notes";
import { Settings } from "lucide-react";
import { useEffect, useMemo } from "react";

export const AppSidebar = () => {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["get-author-directories"],
    queryFn: getAuthorDirectoriesWithChildrenNotes,
    retry: true
  });

  const renameMutation = useMutation({
    mutationFn: ({ id, newName }: { id: number; newName: string }) =>
      renameDirectory(newName, id),
    onSuccess: (_, variables) => {
      queryClient.setQueryData(["get-author-directories"],
        (oldData: { directories: DirectoryWithChildren[]; notes: NoteDataType[] } | undefined) => {
          if (!oldData) return oldData;

          return {
            ...oldData,
            directories: updateDirectoryTitle(oldData.directories, variables.id, variables.newName),
          };
        }
      );
    },
    onError: (error) => {
      console.error("Failed to rename directory:", error);
      queryClient.invalidateQueries({ queryKey: ["get-author-directories"] });
    }
  });

  const notesForSearch = useMemo(() => {
    if (!data) return [];
    return [
      ...data.notes.filter((n) => !n.archived),
      ...data.directories.flatMap((dir) => dir.notes)
    ];
  }, [data]);

  useEffect( () => {

    getAuthorDirectoriesWithChildrenNotes().then((response) => {
      console.log(response);
    })

  }, [])

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
          <SidebarGroup>
            <SidebarGroupContent>

              {data && (
                <DirectoryTree
                  directories={data.directories}
                  aloneNotes={data.notes}
                  onRenameDirectory={renameMutation.mutate}
                />
              )}
            </SidebarGroupContent>
          </SidebarGroup>
        </>
      )}
      <SidebarFooter>
        <UserNav/>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar >
  );
};
