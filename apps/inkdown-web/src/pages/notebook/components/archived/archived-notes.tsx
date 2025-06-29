import type { NoteDataType } from "@/features/notes/types/note-types";
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
	SidebarMenuButton,
	SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Archive } from "lucide-react";
import { ArchivedNoteContainer } from "./archived-note-container";

interface ArchivedNotesProps {
	data: NoteDataType[];
}

export const ArchivedNotes: React.FC<ArchivedNotesProps> = ({ data }) => {
	return (
		<Collapsible>
			<SidebarMenuItem>
				<CollapsibleTrigger className="w-full pl-0" asChild>
					<SidebarMenuButton className="w-full">
						<Archive size={40} className="text-theme-accent" />
						Arquivados
					</SidebarMenuButton>
				</CollapsibleTrigger>
				<CollapsibleContent className="space-y-2 pt-2">
					{data.map((note) => (
						<ArchivedNoteContainer key={note.id} note={note} />
					))}
				</CollapsibleContent>
			</SidebarMenuItem>
		</Collapsible>
	);
};
