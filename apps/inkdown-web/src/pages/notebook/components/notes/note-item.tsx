import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from "@/components/ui/context-menu";
import { Input } from "@/components/ui/input";
import { useArchiveNoteMutation, useUpdateNotaMutation } from "@/features/notes/queries/note-query";
import type { NoteDataType } from "@/features/notes/types/note-types";
import { Archive, Edit, FileIcon } from "lucide-react";
import { Link } from "react-router-dom";
import { useRef, useState } from "react";

interface NoteItemProps {
  note: NoteDataType;
  depth: number;
  onArchive: (noteId: string) => void;
}

export const NoteItem = ({ note, depth, onArchive }: NoteItemProps) => {
  const [isRenaming, setIsRenaming] = useState(false);
  const [newName, setNewName] = useState(note.title);
  const updateNoteMutation = useUpdateNotaMutation();
  const archiveNoteMutation = useArchiveNoteMutation();
  const inputRef = useRef<HTMLInputElement>(null);

  const handleRename = () => {
    if (newName.trim() && newName !== note.title) {
      updateNoteMutation.mutate({ id: note.id, title: newName, content: note.content });
    }
    setIsRenaming(false);
  };

  const handleCloseAutoFocus = (event: Event) => {
    if (isRenaming) {
      event.preventDefault();
      inputRef.current?.focus();
    }
  }

  return (
    <ContextMenu>
      <ContextMenuTrigger>
        <Link to={`/notebook?id=${note.id}`}>
          <div
            className="flex items-center py-2 px-2 hover:bg-accent rounded hover:cursor-pointer"
            style={{ paddingLeft: `${depth * 20 + 32}px` }}
          >
            <FileIcon className="h-4 w-4 mr-2 flex-shrink-0" />
            {isRenaming ? (
              <Input
                ref={inputRef}
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onBlur={handleRename}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleRename();
                  } else if (e.key === ' ') {
                    e.stopPropagation();
                    e.preventDefault();
                  }
                }}
                className="h-6 px-1 text-sm"
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <span className="text-sm truncate">{note.title}</span>
            )}
          </div>
        </Link>
      </ContextMenuTrigger>

      <ContextMenuContent onCloseAutoFocus={handleCloseAutoFocus}>
        <ContextMenuItem onSelect={() => setIsRenaming(true)}>
          <Edit className="h-4 w-4 mr-2" /> Renomear
        </ContextMenuItem>
        <ContextMenuItem
          className="text-red-600"
          onSelect={() => {
            archiveNoteMutation.mutate(note.id);
          }}
        >
          <Archive className="h-4 w-4 mr-2" /> Arquivar
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
};