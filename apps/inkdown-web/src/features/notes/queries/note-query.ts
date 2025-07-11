import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createNote, deleteNote, getNoteContent, updateNoteData } from "../services/note-service";
import type { NoteDataType } from "../types/note-types";
import type { DirectoryWithChildren, GetAuthorDirectoriesResponse } from "@/features/directories/types/directory-types";
import { findDirectory } from "@/features/directories/services/directory-service";

export function useNoteContentQuery(id: string) {
	return useQuery({
		queryFn: () => getNoteContent(id),
		queryKey: ["get-note-content", id],
		enabled: Boolean(id)
	});
}

export function useCreateNoteMutation() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (dirId: number | null) => createNote({ title: "Sem titulo", dirId }),
		onSuccess: (newNote) => {
			queryClient.setQueryData<GetAuthorDirectoriesResponse>(
				["get-author-directories"],
				(oldData) => {
					if (!oldData) return oldData;

					if (!newNote.directoryId) {
						return {
							...oldData,
							notes: [...oldData.notes, newNote]
						};
					}

					// Encontra o diretório pai
					const parentDir = findDirectory(oldData.directories, newNote.directoryId);

					if (!parentDir) return oldData;

					// Atualiza o diretório específico
					const updateDir = (dirs: DirectoryWithChildren[]): DirectoryWithChildren[] =>
						dirs.map(dir => {
							if (dir.id === parentDir.id) {
								return {
									...dir,
									notes: [...dir.notes, newNote]
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
export function useUpdateNotaMutation() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({ id, title, content }: { id: string; title: string; content: string }) =>
			updateNoteData(id, title, content),
		onSuccess: (updatedNote, variables) => {
			queryClient.setQueryData(["get-note-content", variables.id], (oldData: any) => {
				if (!oldData) return oldData;

				return {
					...oldData,
					note: {
						...oldData.note,
						title: updatedNote.title,
						content: updatedNote.content,
						updatedAt: updatedNote.updatedAt
					}
				};
			});

			queryClient.setQueryData(["get-author-directories"], (oldData: any) => {
				if (!oldData) return oldData;

				const updateNote = (noteList: NoteDataType[]) =>
					noteList.map((note) =>
						note.id === variables.id
							? { ...note, title: variables.title, content: variables.content }
							: note
					);

				const updateDirectories = (dirs: DirectoryWithChildren[]): DirectoryWithChildren[] =>
					dirs.map((dir) => ({
						...dir,
						notes: updateNote(dir.notes),
						childrens: dir.childrens ? updateDirectories(dir.childrens) : [],
					}));

				return {
					...oldData,
					notes: updateNote(oldData.notes),
					directories: updateDirectories(oldData.directories),
				};
			});
		},
		onError: (error) => {
			console.error("Erro ao atualizar nota:", error);
		},
	});
}

export function useArchiveNoteMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (noteId: string) => {
      const queryData = queryClient.getQueryData<GetAuthorDirectoriesResponse>(['get-author-directories']);
      let noteToArchive: NoteDataType | undefined;

      if (queryData) {
        // Search in root notes
        noteToArchive = queryData.notes.find(note => note.id === noteId);

        // Search in directory notes
        if (!noteToArchive) {
          const findNoteInDirectories = (dirs: DirectoryWithChildren[]): NoteDataType | undefined => {
            for (const dir of dirs) {
              const found = dir.notes.find(note => note.id === noteId);
              if (found) return found;
              const foundInChildren = findNoteInDirectories(dir.childrens);
              if (foundInChildren) return foundInChildren;
            }
            return undefined;
          };
          noteToArchive = findNoteInDirectories(queryData.directories);
        }
      }

      if (noteToArchive) {
        return updateNoteData(noteId, noteToArchive.title, noteToArchive.content, true);
      } else {
        throw new Error("Note not found in cache.");
      }
    },
    onMutate: async (noteId) => {
      await queryClient.cancelQueries({ queryKey: ['get-author-directories'] });
      
      const previousData = queryClient.getQueryData<GetAuthorDirectoriesResponse>(
        ['get-author-directories']
      );

      if (previousData) {
        const updatedData = {
          ...previousData,
          notes: previousData.notes.map(note => 
            note.id === noteId ? { ...note, archived: true } : note
          ),
          directories: previousData.directories.map(dir => ({
            ...dir,
            notes: dir.notes.map(note => 
              note.id === noteId ? { ...note, archived: true } : note
            ),
            childrens: dir.childrens.map(childDir => ({
              ...childDir,
              notes: childDir.notes.map(note => 
                note.id === noteId ? { ...note, archived: true } : note
              ),
            })),
          })),
        };
        queryClient.setQueryData(['get-author-directories'], updatedData);
        return { previousData };
      }
      return { previousData: undefined };
    },
    onError: (err, _, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(['get-author-directories'], context.previousData);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['get-author-directories'] });
    }
  });
}


export function useDeleteNoteMutationQuery() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (noteId: string) => deleteNote(noteId),
    onMutate: async (noteId) => {
      await queryClient.cancelQueries({ queryKey: ['get-author-directories'] });
      
      const previousData = queryClient.getQueryData<GetAuthorDirectoriesResponse>(
        ['get-author-directories']
      );

      if (previousData) {
        const allNotes = [
          ...previousData.notes,
          ...previousData.directories.flatMap(dir => dir.notes)
        ];
        const noteToDelete = allNotes.find(note => note.id === noteId);
        
        if (!noteToDelete) return { previousData };

        if (noteToDelete.directoryId === null) {
          queryClient.setQueryData(['get-author-directories'], {
            ...previousData,
            notes: previousData.notes.filter(note => note.id !== noteId)
          });
        } else {
          queryClient.setQueryData(['get-author-directories'], {
            ...previousData,
            directories: previousData.directories.map(dir => 
              dir.id === noteToDelete.directoryId
                ? { ...dir, notes: dir.notes.filter(note => note.id !== noteId) }
                : dir
            )
          });
        }
      }

      return { previousData };
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['get-author-directories'] });
    }
  });
}