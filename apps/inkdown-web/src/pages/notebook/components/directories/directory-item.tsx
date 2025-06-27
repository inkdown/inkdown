import { ContextMenuContent, ContextMenuItem } from "@/components/ui/context-menu";
import { Input } from "@/components/ui/input";
import { useDeleteDirectoryMutation } from "@/features/directories/queries/directory-query";
import type { DirectoryWithChildren } from "@/features/directories/types/directory-types";
import { ContextMenu, ContextMenuTrigger } from "@radix-ui/react-context-menu";
import { ChevronDownIcon, ChevronRightIcon, Edit, FilePlus, FolderIcon, FolderOpenIcon, FolderPlus, Trash2 } from "lucide-react";
import { useState } from "react";
import { NoteItem } from "../notes/note-item";
import { useDeleteNoteMutationQuery } from "@/features/notes/queries/note-query";

interface DirectoryItemProps {
  directory: DirectoryWithChildren;
  depth?: number;
  onCreateNote: (parentId: number | null) => void;
  onCreateDirectory: (parentId: number | null) => void;
  onRenameDirectory: (id: number, newTitle: string) => void;
}

export const DirectoryItem = ({
  directory,
  depth = 0,
  onCreateNote,
  onCreateDirectory,
  onRenameDirectory
}: DirectoryItemProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [newName, setNewName] = useState(directory.title);
  const deleteDirectoryMutation = useDeleteDirectoryMutation();
  const deleteNoteMutation = useDeleteNoteMutationQuery();

  const handleRename = () => {
    if (newName.trim() && newName !== directory.title) {
      onRenameDirectory(directory.id, newName);
    }
    setIsRenaming(false);
  };

  return (
    <div className="w-full">
      <ContextMenu>
        <ContextMenuTrigger>
          <div
            className="flex items-center py-1 px-2 hover:bg-accent rounded"
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
                  <ChevronDownIcon className="h-4 w-4" />
                ) : (
                  <ChevronRightIcon className="h-4 w-4" />
                )}


              {isExpanded ? (
                <FolderOpenIcon className="h-4 w-4 mr-2 ml-2" />
              ) : (
                <FolderIcon className="h-4 w-4 mr-2 ml-2" />
              )}

              {isRenaming ? (
                <Input
                  autoFocus
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  onBlur={handleRename}
                  onKeyDown={(e) => e.key === 'Enter' && handleRename()}
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

        <ContextMenuContent>
          <ContextMenuItem onClick={() => onCreateNote(directory.id)}>
            <FilePlus className="h-4 w-4 mr-2" /> Nova Nota
          </ContextMenuItem>
          <ContextMenuItem onClick={() => onCreateDirectory(directory.id)}>
            <FolderPlus className="h-4 w-4 mr-2" /> Novo Diretório
          </ContextMenuItem>
          <ContextMenuItem onClick={() => setIsRenaming(true)}>
            <Edit className="h-4 w-4 mr-2" /> Renomear
          </ContextMenuItem>
          <ContextMenuItem
            className="text-red-600"
            onClick={() => deleteDirectoryMutation.mutate(directory.id)}
          >
            <Trash2 className="h-4 w-4 mr-2" /> Excluir
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>

      {isExpanded && (
        <div className="w-full">
          {directory.notes.map(note => (
            <NoteItem
              key={note.id}
              note={note}
              depth={depth + 1}
              onDelete={() => deleteNoteMutation.mutate(note.id)}
            />
          ))}
          {directory.childrens.map(subDir => (
            <DirectoryItem
              key={subDir.id}
              directory={subDir}
              depth={depth + 1}
              onCreateNote={onCreateNote}
              onCreateDirectory={onCreateDirectory}
              onRenameDirectory={onRenameDirectory}
            />
          ))}
        </div>
      )}
    </div>
  );
};
