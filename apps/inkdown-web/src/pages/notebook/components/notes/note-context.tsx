import {
	ContextMenu,
	ContextMenuContent,
	ContextMenuItem,
	ContextMenuShortcut,
	ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { ArchiveX, PenBox } from "lucide-react";

interface NoteContextProps {
	children: React.ReactNode;
	onRename: () => void;
	onRemove: (id: string) => void;
}

export const NoteContext = ({
	children,
	onRename,
	onRemove,
}: NoteContextProps) => {
	return (
		<ContextMenu>
			<ContextMenuTrigger>{children}</ContextMenuTrigger>
			<ContextMenuContent className="w-50  text-zinc-800 dark:text-zinc-200">
				<ContextMenuItem
					inset
					onClick={(e) => {
						onRename();
						e.stopPropagation();
					}}
				>
					<PenBox />
					<span className="">Renomear</span>
					<ContextMenuShortcut>⌘[</ContextMenuShortcut>
				</ContextMenuItem>
				<ContextMenuItem inset className="group " onClick={() => onRemove}>
					<ArchiveX className="group-hover:text-red-700" />
					<span className="">Excluir</span>
					<ContextMenuShortcut>⌘]</ContextMenuShortcut>
				</ContextMenuItem>
			</ContextMenuContent>
		</ContextMenu>
	);
};
