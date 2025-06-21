export interface NoteDataType {
  id: string;
  title: string;
  content: string;
  directoryId: number | null;
  createdAt: string;
  updatedAt: string;
  archived: boolean;
  type: string,
}

export interface GetNoteContentResponse {
	note: NoteDataType
}

export interface CreateNoteRequest {
	title: string,
	dirId: number | null
}