"use client";

import { useState, useCallback } from "react";
import type { TagsDataType } from "@/app/@types/note-types";

export const useTagsActions = (initialTags: TagsDataType[]) => {
	const [tags, setTags] = useState<TagsDataType[]>(initialTags);

	const handleNewTag = useCallback((color: string, name: string) => {
		console.log("Ue");

		const newTag: TagsDataType = {
			id: Date.now(),
			name: name,
			colorHex: color,
		};
		setTags((prev) => [...prev, newTag]);
	}, []);

	const handleRenameTag = useCallback((id: number, newName: string) => {
		setTags((prev) =>
			prev.map((tag) => (tag.id === id ? { ...tag, name: newName } : tag)),
		);
	}, []);

	const handleChangeColor = useCallback((id: number, newColor: string) => {
		setTags((prev) =>
			prev.map((tag) => (tag.id === id ? { ...tag, colorHex: newColor } : tag)),
		);
	}, []);

	const handleDeleteTag = useCallback((id: number) => {
		setTags((prev) => prev.filter((tag) => tag.id !== id));
	}, []);

	return {
		tags,
		handleRenameTag,
		handleChangeColor,
		handleDeleteTag,
		handleNewTag,
	};
};
