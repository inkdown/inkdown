import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from "@/components/ui/context-menu";
import type { NoteDataType } from "@/features/notes/types/note-types";
import { Edit, FileIcon, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";

interface NoteItemProps {
  note: NoteDataType;
  depth: number;
  onDelete: () => void;
}

export const NoteItem = ({ note, depth, onDelete }: NoteItemProps) => {
  return (
    <ContextMenu>
      <ContextMenuTrigger>
        <Link to={`/notebook?id=${note.id}`}>
          <div
            className="flex items-center py-1 px-2 hover:bg-zinc-200  rounded cursor-pointer"
            style={{ paddingLeft: `${depth * 20 + 32}px` }}
          >
            <FileIcon className="h-4 w-4 mr-2 " />
            <span className="text-sm truncate">{note.title}</span>
          </div>
        </Link>
      </ContextMenuTrigger>

      <ContextMenuContent>
        <ContextMenuItem>
          <FileIcon className="h-4 w-4 mr-2" /> Abrir
        </ContextMenuItem>
        <ContextMenuItem>
          <Edit className="h-4 w-4 mr-2" /> Renomear
        </ContextMenuItem>
        <ContextMenuItem
          className="text-red-600"
          onClick={onDelete}
        >
          <Trash2 className="h-4 w-4 mr-2" /> Excluir
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
};