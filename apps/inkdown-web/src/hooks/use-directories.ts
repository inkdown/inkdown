import type { DirectoryDataType } from "@/features/notes/types/directory-types";
import { useState, useCallback } from "react";

// Função recursiva para renomear diretórios aninhados
function renameDirectoryRecursive(
  dirs: DirectoryDataType[],
  id: number,
  newName: string,
): DirectoryDataType[] {
  return dirs.map((dir) => {
    if (dir.id === id) {
      return { ...dir, title: newName };
    }
    if (Array.isArray(dir.childrens) && dir.childrens.length > 0) {
      return {
        ...dir,
        childrens: renameDirectoryRecursive(dir.childrens, id, newName),
      };
    }
    return dir;
  });
}

export const useDirectoriesActions = (
  initialDirectories: DirectoryDataType[]
) => {
  const [directories, setDirectories] = useState(initialDirectories);
  const [editingId, setEditingId] = useState<number | null>(null);

  const startEditing = (id: number) => setEditingId(id);
  const stopEditing = () => setEditingId(null);

  const handleRenameDirectory = useCallback((newName: string, id: number) => {
    setDirectories((prev) => renameDirectoryRecursive(prev, id, newName));
  }, []);

  return {
    directories,
    handleRenameDirectory,
    editingId,
    startEditing,
    stopEditing,
  };
};