import { ContextMenuContent, ContextMenuItem } from "@/components/ui/context-menu";
import { Input } from "@/components/ui/input";
import { useDeleteDirectoryMutation, useRenameDirectoryMutation } from "@/features/directories/queries/directory-query";
import type { DirectoryWithChildren } from "@/features/directories/types/directory-types";
import { ContextMenu, ContextMenuTrigger } from "@radix-ui/react-context-menu";
import { ChevronDownIcon, ChevronRightIcon, Edit, FilePlus, FolderIcon, FolderOpenIcon, FolderPlus, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { NoteItem } from "../notes/note-item";

interface DirectoryItemProps {
  directory: DirectoryWithChildren;
  depth?: number;
  onCreateNote: (parentId: number | null) => void;
  onCreateDirectory: (parentId: number | null) => void;
  onArchiveNote: (noteId: string) => void;
}

export const DirectoryItem = ({
  directory,
  depth = 0,
  onCreateNote,
  onCreateDirectory,
  onArchiveNote
}: DirectoryItemProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [newName, setNewName] = useState(directory.title);
  const deleteDirectoryMutation = useDeleteDirectoryMutation();
  const renameDirectoryMutation = useRenameDirectoryMutation();
  const inputRef = useRef<HTMLInputElement>(null);

  const handleRename = () => {
    if (newName.trim() && newName !== directory.title) {
      renameDirectoryMutation.mutate({ id: directory.id, newName });
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
    <div className="w-full">
      <ContextMenu>
        <ContextMenuTrigger>
          <div
            className="flex items-center py-2 px-2 hover:bg-accent rounded"
            style={{ paddingLeft: `${depth * 20 + 8}px` }}
          >
            <button
              className="mr-1 w-full flex items-center hover:cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                setIsExpanded(!isExpanded);
              }}
            >

              {
                isExpanded ? (
                  <ChevronDownIcon className="h-4 w-4 flex-shrink-0" />
                ) : (
                  <ChevronRightIcon className="h-4 w-4 flex-shrink-0" />
                )}


              {isExpanded ? (
                <FolderOpenIcon className="h-4 w-4 mr-2 ml-2 flex-shrink-0" />
              ) : (
                <FolderIcon className="h-4 w-4 mr-2 ml-2 flex-shrink-0" />
              )}

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
                <span
                  className="text-sm truncate"
                >
                  {directory.title}
                </span>
              )}
            </button>
          </div>
        </ContextMenuTrigger>

        <ContextMenuContent onCloseAutoFocus={handleCloseAutoFocus}>
          <ContextMenuItem onSelect={() => onCreateNote(directory.id)}>
            <FilePlus className="h-4 w-4 mr-2" /> Nova Nota
          </ContextMenuItem>
          <ContextMenuItem onSelect={() => onCreateDirectory(directory.id)}>
            <FolderPlus className="h-4 w-4 mr-2" /> Novo Diretório
          </ContextMenuItem>
          <ContextMenuItem onSelect={() => setIsRenaming(true)}>
            <Edit className="h-4 w-4 mr-2" /> Renomear
          </ContextMenuItem>
          <ContextMenuItem
            className="text-red-600"
            onSelect={() => deleteDirectoryMutation.mutate(directory.id)}
          >
            <Trash2 className="h-4 w-4 mr-2" /> Excluir
          </ContextMenuItem>
        </ContextMenuContent>

      {isExpanded && (
        <div className="w-full">
          {directory.notes.map(note => (
            <NoteItem
              key={note.id}
              note={note}
              depth={depth + 1}
              onArchive={onArchiveNote}
            />
          ))}
          {directory.childrens.map(subDir => (
            <DirectoryItem
              key={subDir.id}
              directory={subDir}
              depth={depth + 1}
              onCreateNote={onCreateNote}
              onCreateDirectory={onCreateDirectory}
              onArchiveNote={onArchiveNote}
            />
          ))}
        </div>
      )}
    </ContextMenu>
  </div>
  );
};
