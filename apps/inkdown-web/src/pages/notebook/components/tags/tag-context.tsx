"use client";

import { useState, useRef, useEffect } from "react";
import type { TagsDataType } from "@/app/@types/note-types";
import {
	ContextMenu,
	ContextMenuContent,
	ContextMenuItem,
	ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { ArchiveX, Palette, PenBox } from "lucide-react";
import { ColorPicker } from "./color-picker";

interface TagContextProps {
	tag: TagsDataType;
	children: React.ReactNode;
	onRename: (id: number, newName: string) => void;
	onChangeColor: (id: number, newColor: string) => void;
	onDelete: (id: number) => void;
}

export const TagContext = ({
	tag,
	children,
	onRename,
	onChangeColor,
	onDelete,
}: TagContextProps) => {
	const [isRenaming, setIsRenaming] = useState(false);
	const [newName, setNewName] = useState(tag.name);
	const [localColor, setLocalColor] = useState(tag.colorHex);
	const inputRef = useRef<HTMLInputElement>(null);

	useEffect(() => {
		setLocalColor(tag.colorHex);
	}, [tag.colorHex]);

	useEffect(() => {
		if (isRenaming && inputRef.current) {
			inputRef.current.focus();
			inputRef.current.select();
		}
	}, [isRenaming]);

	const handleRename = () => {
		if (newName.trim() && newName !== tag.name) {
			onRename(tag.id, newName.trim());
		}
		setIsRenaming(false);
	};

	const handleColorChange = (color: string) => {
		setLocalColor(color);
		onChangeColor(tag.id, color);
	};

	return (
		<ContextMenu>
			<ContextMenuTrigger>{children}</ContextMenuTrigger>

			<ContextMenuContent
				className="w-60 dark:text-zinc-200"
				onCloseAutoFocus={(e) => e.preventDefault()}
				onInteractOutside={() => setIsRenaming(false)}
			>
				<ContextMenuItem
					inset
					className="p-0"
					onSelect={(e) => e.preventDefault()}
				>
					{isRenaming ? (
						<div className="px-2 py-1.5 w-full">
							<input
								ref={inputRef}
								value={newName}
								onChange={(e) => setNewName(e.target.value)}
								onKeyDown={(e) => {
									if (e.key === "Enter") handleRename();
									if (e.key === "Escape") setIsRenaming(false);
									if (e.key === "A") e.stopPropagation();
								}}
								className="w-full px-2 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
								onClick={(e) => e.stopPropagation()}
							/>
						</div>
					) : (
						<button
							className="flex items-center w-full px-2 py-1.5 text-left"
							onClick={() => setIsRenaming(true)}
						>
							<PenBox className="mr-2 h-4 w-4" />
							<span>Renomear</span>
						</button>
					)}
				</ContextMenuItem>

				<ContextMenuItem
					asChild
					inset
					className="p-0"
					onClick={(e) => e.stopPropagation}
				>
					<div className="flex items-center w-full px-2 py-1.5">
						<Palette className="mr-2 h-4 w-4" />
						<span>Alterar cor</span>
						<div className="ml-auto" onClick={(e) => e.stopPropagation()}>
							<ColorPicker
								currentColor={localColor}
								onColorChange={handleColorChange}
							/>
						</div>
					</div>
				</ContextMenuItem>

				<ContextMenuItem
					inset
					className="group hover:!text-red-800 p-0"
					onClick={() => onDelete(tag.id)}
				>
					<button className="flex items-center hover:cursor-pointer w-full px-2 py-1.5 text-left">
						<ArchiveX className="mr-2 h-4 w-4 group-hover:text-red-800" />
						<span>Apagar</span>
					</button>
				</ContextMenuItem>
			</ContextMenuContent>
		</ContextMenu>
	);
};
