import type { NoteDataType } from "@/app/@types/note-types";
import {
	ContextMenu,
	ContextMenuCheckboxItem,
	ContextMenuContent,
	ContextMenuItem,
	ContextMenuLabel,
	ContextMenuRadioGroup,
	ContextMenuRadioItem,
	ContextMenuSeparator,
	ContextMenuShortcut,
	ContextMenuSub,
	ContextMenuSubContent,
	ContextMenuSubTrigger,
	ContextMenuTrigger,
} from "@/components/ui/context-menu";
import {
	SidebarMenuSub,
	SidebarMenuSubButton,
	SidebarMenuSubItem,
} from "@/components/ui/sidebar";
import { ArchiveRestore, ArchiveX } from "lucide-react";

export const ArchivedNoteContainer = ({ note }: { note: NoteDataType }) => {
	return (
		<ContextMenu>
			<ContextMenuTrigger>
				<SidebarMenuSub key={note.id}>
					<SidebarMenuSubButton className="hover:cursor-pointer">
						{note.name}
					</SidebarMenuSubButton>
				</SidebarMenuSub>
			</ContextMenuTrigger>
			<ContextMenuContent className="w-50">
				<ContextMenuItem inset className="text-zinc-500">
					<ArchiveRestore />
					<span className="text-zinc-800">Recuperar</span>
					<ContextMenuShortcut>⌘[</ContextMenuShortcut>
				</ContextMenuItem>
				<ContextMenuItem inset className="group text-zinc-500">
					<ArchiveX className="group-hover:text-red-700" />
					<span className="text-zinc-800">Excluir</span>
					<ContextMenuShortcut>⌘]</ContextMenuShortcut>
				</ContextMenuItem>
			</ContextMenuContent>
		</ContextMenu>
	);
};
