import type { DirectoryWithChildren } from "@/features/directories/types/directory-types";
import type { NoteDataType } from "@/features/notes/types/note-types"
import { NewNoteDirectoryContext } from "../new-note-directory-context";
import { DirectoryItem } from "./directory-item";
import { NoteItem } from "../notes/note-item";

interface DirectoryTreeProps {
  directories: DirectoryWithChildren[];
  aloneNotes: NoteDataType[];
  onCreateNote: (parentId: number | null) => void;
  onCreateDirectory: (parentId: number | null) => void;
  onArchiveNote: (noteId: string) => void;
}

export const DirectoryTree = ({
  directories,
  aloneNotes,
  onCreateNote,
  onCreateDirectory,
  onArchiveNote
}: DirectoryTreeProps) => {

  return (
    <div className="w-full h-full py-2">
      {directories.map(dir => (
        <DirectoryItem
          key={dir.id}
          directory={dir}
          depth={0}
          onCreateNote={onCreateNote}
          onCreateDirectory={onCreateDirectory}
          onArchiveNote={onArchiveNote}
        />
      ))}
      {aloneNotes.map(note => (
        <NoteItem
          key={note.id}
          note={note}
          depth={0}
          onArchive={onArchiveNote}
        />
      ))}
      <NewNoteDirectoryContext
        handleNewNote={() => onCreateNote(null)}
        handleNewDirectory={() => onCreateDirectory(null)}
      >
      <div className="h-full"/>
      </NewNoteDirectoryContext>
    </div>
  );
};