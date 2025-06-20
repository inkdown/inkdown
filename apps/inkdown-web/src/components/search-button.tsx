import * as React from "react";
import { Button } from "@/components/ui/button";
import { Notebook, Search } from "lucide-react";
import {
	Palette,
	PenBox,
	Settings,
	User,
} from "lucide-react";

import {
	CommandDialog,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
	CommandSeparator,
	CommandShortcut,
} from "@/components/ui/command";
import type { NoteDataType } from "@/features/notes/types/note-types";
import { Link } from "react-router-dom";

interface SearchButtonProps {
	notes: NoteDataType[];
}

export const SearchButton = ({ notes }: SearchButtonProps) => {
	const [open, setOpen] = React.useState(false);

	console.log(notes);

	React.useEffect(() => {
		const down = (e: KeyboardEvent) => {
			if (e.key === "e" && (e.metaKey || e.ctrlKey)) {
				e.preventDefault();
				setOpen((open) => !open);
			}
		};

		document.addEventListener("keydown", down);
		return () => document.removeEventListener("keydown", down);
	}, []);

	return (
		<>
			<Button
				onClick={() => setOpen(true)}
				className="flex dark:text-zinc-200 w-full justify-start space-x-4 bg-indigo-600 hover:bg-indigo-800 hover:cursor-pointer"
			>
				<Search />
				Buscar
				<p className="text-sm text-muted-foreground w-full flex justify-end">
					<kbd className="pointer-events-none self text-zinc-200 bg-transparent border-none inline-flex h-5 select-none items-center gap-1 rounded border px-1.5 font-mono text-[15px] font-medium">
						<span className="text-sm">⌘e</span>
					</kbd>
				</p>
			</Button>
			<CommandDialog open={open} onOpenChange={setOpen}>
				<CommandInput placeholder="Digite o comando..." />
				<CommandList>
					<CommandEmpty>Nenhum resultado.</CommandEmpty>
					<CommandGroup heading="Notas">
						{notes.map((note) => (
							<Link
								onClick={() => setOpen(false)}
								key={note.id}
								className="hover:cursor-pointer"
								to={`?id=${note.id}`}
							>
								<CommandItem>
									<Notebook />
									<span>{note.title}</span>
								</CommandItem>
							</Link>
						))}
					</CommandGroup>
					<CommandSeparator />
					<CommandGroup heading="Configurações">
						<Link
							onClick={() => setOpen(false)}
							to={"/account"}
							className="hover:cursor-pointer"
						>
							<CommandItem>
								<User />
								<span>Conta</span>
								<CommandShortcut>⌘P</CommandShortcut>
							</CommandItem>
						</Link>
						<CommandItem>
							<PenBox />
							<span>Editor</span>
							<CommandShortcut>⌘B</CommandShortcut>
						</CommandItem>
						<CommandItem>
							<Palette />
							<span>Temas</span>
							<CommandShortcut>⌘S</CommandShortcut>
						</CommandItem>
						<Link
							onClick={() => setOpen(false)}
							to={"/settings"}
							className="hover:cursor-pointer"
						>
							<CommandItem>
								<Settings />
								<span>Configurações</span>
								<CommandShortcut>⌘S</CommandShortcut>
							</CommandItem>
						</Link>
					</CommandGroup>
				</CommandList>
			</CommandDialog>
		</>
	);
};
