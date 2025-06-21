import { useMutation, useQuery, useQueryClient, type UseQueryResult } from "@tanstack/react-query";
import { createDirectory, deleteDirectory, getAuthorDirectoriesWithChildrenNotes, renameDirectory, updateDirectoryTitle } from "../services/directory-service";
import type { DirectoryWithChildren, GetAuthorDirectoriesResponse } from "../types/directory-types";
import type { NoteDataType } from "@/features/notes/types/note-types";

export function useDirectoriesWithChildrenQuery(): UseQueryResult<GetAuthorDirectoriesResponse, Error> {
  return useQuery({
    queryKey: ["get-author-directories"],
    queryFn: getAuthorDirectoriesWithChildrenNotes,
    retry: true
  });
}

export function useRenameDirectoryMutation() {
  const queryClient = useQueryClient();

  return useMutation({
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
}

export function useCreateDirectoryMutation() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: createDirectory,
    mutationKey: ["get-author-directories"],
    onSuccess: (data, _) => {
      queryClient.setQueryData(["get-author-directories"],
        (oldData: { directories: DirectoryWithChildren[]; notes: NoteDataType[] } | undefined) => {
          if (!oldData) return oldData;

          const newDir = {
            childrens: [],
            id: data.id,
            notes: [],
            title: data.title,
            parentId: data.parentId
          };

          return {
            ...oldData,
            directories: [...oldData.directories, newDir],
          };
        }
      );
    }
  });
}

export function useDeleteDirectoryMutation() {
  const queryClient = useQueryClient();
  
  return useMutation({
		mutationFn: deleteDirectory,
		mutationKey: ["get-author-directories"],
		onSuccess: (_, variables) => {
			queryClient.setQueryData(["get-author-directories"],
				(oldData: { directories: DirectoryWithChildren[]; notes: NoteDataType[] } | undefined) => {
					if (!oldData) return oldData;

					const updatedDirectories = oldData.directories.filter(
						(dir) => dir.id !== variables
					);

					return {
						...oldData,
						directories: updatedDirectories,
					};
				}
			)
		}
	})
}