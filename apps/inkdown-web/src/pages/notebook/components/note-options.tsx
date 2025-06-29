import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useArchiveNoteMutation } from "@/features/notes/queries/note-query"
import { Archive, EllipsisVertical } from "lucide-react"
import { useNavigate } from "react-router-dom";

export const NoteOptions = ({ noteId }: { noteId: string }) => {
  const mutateArquive = useArchiveNoteMutation();
  const router = useNavigate();


  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="mr-10 hover:cursor-pointer">
        <EllipsisVertical size={20} />
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="start">
        <DropdownMenuLabel>Opções</DropdownMenuLabel>
        <DropdownMenuGroup>
          <DropdownMenuItem onClick={() => {
              mutateArquive.mutate(noteId);
              router("/notebook")
          }} className="hover:cursor-pointer">
            <Archive className="text-red-600"/>
            Arquivar
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}