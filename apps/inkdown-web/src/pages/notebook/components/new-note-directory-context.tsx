import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuShortcut,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { FilePlus, FolderPlus } from "lucide-react";

interface NewNoteDirectoryContextProps {
  handleNewDirectory: () => void; 
  handleNewNote: () => void;
  parentId?: number;
  children: React.ReactNode
}

export const NewNoteDirectoryContext = ({
  handleNewDirectory,
  handleNewNote,
  children
}: NewNoteDirectoryContextProps) => {
  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        {children}
      </ContextMenuTrigger>
      <ContextMenuContent className="w-50 text-zinc-800 dark:text-zinc-200">
        <ContextMenuItem
          inset
          onClick={handleNewDirectory}
        >
          <FolderPlus />
          <span>Novo diretório</span>
          <ContextMenuShortcut>⌘d</ContextMenuShortcut>
        </ContextMenuItem>
        <ContextMenuItem 
          inset
          onClick={handleNewNote}
          >
          <FilePlus />
          <span>Nova nota</span>
          <ContextMenuShortcut>⌘f</ContextMenuShortcut>
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  )
}