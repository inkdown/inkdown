"use client";

import { createContext, useContext, useState } from "react";
import type { TagsDataType } from "@/app/@types/note-types";
import { useTagsActions } from "@/hooks/use-tags";

type TagsContextType = {
	tags: TagsDataType[];
	handleNewTag: (name: string, color: string) => void;
	handleRenameTag: (id: number, newName: string) => void;
	handleChangeColor: (id: number, newColor: string) => void;
	handleDeleteTag: (id: number) => void;
};

const TagsContext = createContext<TagsContextType | undefined>(undefined);

export const TagsProvider = ({
	initialTags,
	children,
}: {
	initialTags: TagsDataType[];
	children: React.ReactNode;
}) => {
	const {
		tags,
		handleChangeColor,
		handleDeleteTag,
		handleNewTag,
		handleRenameTag,
	} = useTagsActions(initialTags);

	return (
		<TagsContext.Provider
			value={{
				tags,
				handleChangeColor,
				handleDeleteTag,
				handleNewTag,
				handleRenameTag,
			}}
		>
			{children}
		</TagsContext.Provider>
	);
};

export const useTagsContext = () => {
	const ctx = useContext(TagsContext);
	if (!ctx) throw new Error("useTagsContext must be used inside TagsProvider");
	return ctx;
};
