import type { NoteDataType } from "./note-types";

export interface DirectoryDataType {
	title: string;
	id: number;
	parentId: number | null;
	childrens: DirectoryDataType[] | null;
	notes: NoteDataType[];
}

export type DirectoryWithChildren = DirectoryDataType & {
  notes: NoteDataType[];
  childrens: DirectoryWithChildren[];
};

export type GetAuthorDirectoriesResponse = {
	directories: DirectoryWithChildren[],
	notes: NoteDataType[],
}