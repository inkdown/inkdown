import {
	ContextMenu,
	ContextMenuContent,
	ContextMenuItem,
	ContextMenuShortcut,
	ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { deleteDirectory } from "@/features/notes/services/note-service";
import type { DirectoryWithChildren } from "@/features/notes/types/directory-types";
import type { NoteDataType } from "@/features/notes/types/note-types";
import { useMutation, useQueryClient } from "@tanstack/react-query";
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
	const queryClient = useQueryClient();

	console.log(id);

	const deleteMutation = useMutation({
		mutationFn: deleteDirectory,
		mutationKey: ["get-author-directories"],
		onSuccess: (_, variables) => {
			queryClient.setQueryData(["get-author-directories"],
				(oldData: { directories: DirectoryWithChildren[]; notes: NoteDataType[] } | undefined) => {
					if (!oldData) return oldData;

					const updatedDirectories = oldData.directories.filter(
						(dir) => dir.id !== variables
					);

					return {
						...oldData,
						directories: updatedDirectories,
					};
				}
			)
		}
	})

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
				<ContextMenuItem inset className="group " onClick={() => deleteMutation.mutate(id)}>
					<ArchiveX className="group-hover:text-red-700" />
					<span>Excluir</span>
					<ContextMenuShortcut>⌘]</ContextMenuShortcut>
				</ContextMenuItem>
			</ContextMenuContent>
		</ContextMenu>
	);
};