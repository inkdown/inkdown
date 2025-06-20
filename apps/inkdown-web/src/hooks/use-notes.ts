"use client";

import type { NoteDataType } from "@/app/@types/note-types";
import { useCallback, useState } from "react";

export const useNotesActions = (initialNotes: NoteDataType[]) => {
	const [notes, setNotes] = useState(initialNotes);

	const handleNewNote = useCallback((name: string, directoryId: number) => {
		const newNote: NoteDataType = {
			title: name,
			archived: false,
			directoryId,
			id: Date.now().toString(),
		};

		setNotes((prevNotes) => [...prevNotes, newNote]);
	}, []);

	const handleRenameNote = useCallback((id: string, newName: string) => {
		setNotes((prev) =>
			prev.map((note) => (note.id === id ? { ...note, name: newName } : note)),
		);
	}, []);

	const handleDeleteNote = useCallback((id: string) => {
		setNotes((prev) => prev.filter((note) => note.id !== id));
	}, []);

	return {
		notes,
		handleNewNote,
		handleRenameNote,
		handleDeleteNote,
	};
};
