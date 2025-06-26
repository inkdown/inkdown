import { useMutation, useQuery, useQueryClient, type UseQueryResult } from "@tanstack/react-query";
import { createDirectory, deleteDirectory, findDirectory, getAuthorDirectoriesWithChildrenNotes, renameDirectory, updateDirectoryTitle } from "../services/directory-service";
import type { DirectoryWithChildren, GetAuthorDirectoriesResponse } from "../types/directory-types";
import type { NoteDataType } from "@/features/notes/types/note-types";

export function useDirectoriesWithChildrenQuery(): UseQueryResult<GetAuthorDirectoriesResponse, Error> {
  return useQuery({
    queryKey: ["get-author-directories"],
    queryFn: getAuthorDirectoriesWithChildrenNotes,
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
    onSuccess: (newDir) => {
      queryClient.setQueryData<GetAuthorDirectoriesResponse>(
        ["get-author-directories"],
        (oldData) => {
          if (!oldData) return oldData;

          // Diretório raiz
          if (!newDir.parentId) {
            return {
              ...oldData,
              directories: [
                ...oldData.directories,
                {
                  ...newDir,
                  childrens: [],
                  notes: []
                }
              ]
            };
          }

          // Encontra o diretório pai
          const parentDir = findDirectory(oldData.directories, newDir.parentId);

          if (!parentDir) return oldData;

          // Atualiza o diretório específico
          const updateDir = (dirs: DirectoryWithChildren[]): DirectoryWithChildren[] =>
            dirs.map(dir => {
              if (dir.id === parentDir.id) {
                return {
                  ...dir,
                  childrens: [
                    ...dir.childrens,
                    {
                      ...newDir,
                      childrens: [],
                      notes: []
                    }
                  ]
                };
              }
              return {
                ...dir,
                childrens: updateDir(dir.childrens)
              };
            });

          return {
            ...oldData,
            directories: updateDir(oldData.directories)
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
    onSuccess: (_, directoryId) => {
      queryClient.setQueryData<GetAuthorDirectoriesResponse>(
        ["get-author-directories"],
        (oldData) => {
          if (!oldData) return oldData;

          const removeDirectory = (
            dirs: DirectoryWithChildren[],
            targetId: number
          ): DirectoryWithChildren[] => {
            return dirs
              .filter(dir => dir.id !== targetId)
              .map(dir => ({
                ...dir,
                childrens: removeDirectory(dir.childrens, targetId)
              }));
          };

          return {
            ...oldData,
            directories: removeDirectory(oldData.directories, directoryId)
          };
        }
      );
    }
  });
}