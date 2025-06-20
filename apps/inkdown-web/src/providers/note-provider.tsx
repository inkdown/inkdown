"use client";

import type { NoteDataType } from "@/app/@types/note-types";
import { useNotesActions } from "@/hooks/use-notes";
import { createContext, useContext } from "react";

type NoteContextType = {
	notes: NoteDataType[];
	handleNewNote: (name: string, directoryId: number) => void;
	handleRenameNote: (id: string, newName: string) => void;
	handleDeleteNote: (id: string) => void;
};

const NotesContext = createContext<NoteContextType | undefined>(undefined);

export const NoteProvider = ({
	initialNotes,
	children,
}: {
	initialNotes: NoteDataType[];
	children: React.ReactNode;
}) => {
	const { handleDeleteNote, handleNewNote, handleRenameNote, notes } =
		useNotesActions(initialNotes);

	return (
		<NotesContext.Provider
			value={{
				notes,
				handleDeleteNote,
				handleNewNote,
				handleRenameNote,
			}}
		>
			{children}
		</NotesContext.Provider>
	);
};

export const useNotesContext = () => {
	const ctx = useContext(NotesContext);
	if (!ctx)
		throw new Error("useNotesContext needs to be used inside of a provider");
	return ctx;
};
