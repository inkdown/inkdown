import {
	ContextMenu,
	ContextMenuContent,
	ContextMenuItem,
	ContextMenuShortcut,
	ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { ArchiveX, PenBox } from "lucide-react";

interface DirectoryContextProps {
	children: React.ReactNode;
	onRenameDirectory: () => void;
	id: number;
}

export const DirectoryContext = ({
	children,
	onRenameDirectory,
	id,
}: DirectoryContextProps) => {
	return (
		<ContextMenu>
			<ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
			<ContextMenuContent className="w-50 text-zinc-800 dark:text-zinc-200">
				<ContextMenuItem
					inset
					onClick={(e) => {
						e.stopPropagation();
						onRenameDirectory();
					}}
				>
					<PenBox />
					<span>Renomear</span>
					<ContextMenuShortcut>⌘[</ContextMenuShortcut>
				</ContextMenuItem>
				<ContextMenuItem inset className="group " onClick={() => console.log("Excluir", id)}>
					<ArchiveX className="group-hover:text-red-700" />
					<span>Excluir</span>
					<ContextMenuShortcut>⌘]</ContextMenuShortcut>
				</ContextMenuItem>
			</ContextMenuContent>
		</ContextMenu>
	);
};