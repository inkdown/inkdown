import { Folder } from "lucide-react";

import {
	Dialog,
	DialogClose,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export const NewDirectoryButton = () => {
	return (
		<Dialog>
			<DialogTrigger asChild>
				<span className="">
					<Folder />
					Novo
				</span>
			</DialogTrigger>
			<DialogContent
				className="sm:max-w-[425px]"
				onClick={(e) => e.stopPropagation()}
			>
				<DialogHeader>
					<DialogTitle className="text-indigo-400">
						Criar uma nova tag
					</DialogTitle>
					<DialogDescription>
						De um nome a sua tag e a cor que mais acredita representa-la. Após a
						criação você poderá edita-las a qualquer momento
					</DialogDescription>
				</DialogHeader>
				<DialogFooter className="pt-5">
					<DialogClose asChild>
						<Button variant="outline">Cancelar</Button>
					</DialogClose>
					<Button className="bg-indigo-400 hover:bg-indigo-600 transition-all hover:cursor-pointer">
						Criar tag
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
};
