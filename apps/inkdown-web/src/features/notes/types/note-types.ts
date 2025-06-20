export interface NoteDataType {
	title: string;
	id: string;
	content: string;
	createdAt: string;
	type: string;
	archived: boolean;
	directoryId: number | null;
}

export interface GetNoteContentResponse {
	note: NoteDataType
}