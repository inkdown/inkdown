"use client";

import type { DirectoryDataType } from "@/features/notes/types/directory-types";
import { useDirectoriesActions } from "@/hooks/use-directories";
import { createContext, useContext } from "react";
import type { ReactNode } from "react";

type DirectoryContextType = {
	directories: DirectoryDataType[];
	handleNewDirectory: (name: string, parentId: number | null) => void;
	handleRenameDirectory: (newName: string, id: number) => void;
	handleDeleteDirectory: (id: number) => void;
	startEditing: (id: number) => void;
	stopEditing: () => void;
	editingId: number | null;
};

const DirectoriesContext = createContext<DirectoryContextType | undefined>(
	undefined,
);

type DirectoryProviderProps = {
	initialDirectories: DirectoryDataType[];
	children: ReactNode | ((context: DirectoryContextType) => ReactNode);
};

export const DirectoryProvider = ({
	initialDirectories,
	children,
}: DirectoryProviderProps) => {
	const contextValue = useDirectoriesActions(initialDirectories);

	return (
		<DirectoriesContext.Provider value={contextValue}>
			{typeof children === "function" ? children(contextValue) : children}
		</DirectoriesContext.Provider>
	);
};

export const useDirectoriesContext = () => {
	const ctx = useContext(DirectoriesContext);
	if (!ctx)
		throw new Error(
			"useDirectoriesContext needs to be used inside of a provider",
		);
	return ctx;
};
