import type { NoteDataType } from "../../notes/types/note-types";


export interface DirectoryDataType {
  id: number;
  title: string;
  parentId: number | null;
  authorId: string;
  createdAt: string; // Ou Date se converter
  updatedAt: string; // Ou Date se converter
  notes: NoteDataType[];
  childrens: DirectoryWithChildren[];
}

export type DirectoryWithChildren = DirectoryDataType;

export type GetAuthorDirectoriesResponse = {
	directories: DirectoryWithChildren[],
	notes: NoteDataType[],
}

export type CreateDirectoryRequest = {
	title: string,
	parentId: number | null
}

export type CreateDirectoryResponse = {
	title: string;
	parentId: number | null;
	id: number;
	authorId: string;
}