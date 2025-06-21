import { useTree } from "@headless-tree/react";
import { FileIcon, FolderIcon, FolderOpenIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Tree, TreeItem, TreeItemLabel } from "@/components/tree";
import type { DirectoryDataType } from "@/features/directories/types/directory-types";
import { DirectoryContext } from "./directory-context";
import { hotkeysCoreFeature, renamingFeature, selectionFeature, syncDataLoaderFeature } from "@headless-tree/core";
import type { NoteDataType } from "@/features/notes/types/note-types";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useMemo, useRef } from "react";
import { Link } from "react-router-dom";

export interface DirectoryItem {
  id: string;
  name: string;
  type: 'directory' | 'note';
  children?: string[];
}

export function DirectoryTree({
  directories,
  aloneNotes,
  onRenameDirectory,
}: {
  directories: DirectoryDataType[],
  aloneNotes: NoteDataType[],
  onRenameDirectory: (data: { id: number; newName: string }) => void,
}) {

  const items = useMemo(() => buildItemsFromTree(directories, aloneNotes), [directories, aloneNotes]);
  const inputRef = useRef<HTMLInputElement>(null);

  const tree = useTree<DirectoryItem>({
    initialState: {
      expandedItems: ["root"],
    },
    indent,
    rootItemId: "root",
    getItemName: (item) => item.getItemData().name,
    
    isItemFolder: (item) =>
      item.getItemData().type === 'directory' &&
      (item.getItemData().children?.length ?? 0) > 0,
    dataLoader: {
      getItem: (itemId) => {
        const item = items[itemId];
        if (!item) {
          return { id: itemId, name: '', type: 'directory', children: [] };
        }
        return item;
      },
      getChildren: (itemId) => items[itemId]?.children ?? [],
    },
    onRename: (item, newName) => {
      const itemId = item.getId();

      console.log(newName);
      if (!itemId.startsWith('note-')) {
        onRenameDirectory({ id: parseInt(itemId), newName });
      }
    },
    features: [
      syncDataLoaderFeature,
      hotkeysCoreFeature,
      renamingFeature,
      selectionFeature,
    ],
  });

  // Rebuida a arvore do zero, porem quando o estado inteiro muda.
  /* useEffect(() => {
    tree.rebuildTree();
  }, [items]);
 */
  return (
    <div className="flex h-full flex-col gap-2 *:first:grow">
      <ScrollArea className="max-h-[calc(110vh-20rem)] overflow-hidden overflow-scroll">
        <Tree indent={indent} tree={tree} className="bg-none"  >
          {tree.getItems().map((item) => {
            const itemData = item.getItemData();
            const isDir = itemData.type === "directory";
            const isRenaming = item.isRenaming();

            if (isDir) {
              return (
                <DirectoryContext
                  key={item.getId()}
                  id={parseInt(itemData.id)}
                  onRenameDirectory={() => {
                    setTimeout(() => item.startRenaming(), 0);
                  }}
                >
                  <TreeItem
                    className="bg-none"
                    item={item}
                    style={{ cursor: "default" }}
                  >
                    <TreeItemLabel className="dark:bg-zinc-900 bg-sidebar">
                      <span className="flex items-center gap-2">
                        {item.isExpanded() ? (
                          <FolderOpenIcon className="text-muted-foreground pointer-events-none size-4" />
                        ) : (
                          <FolderIcon className="text-muted-foreground pointer-events-none size-4" />
                        )}
                        {isRenaming ? (
                          <Input
                            {...item.getRenameInputProps()}
                          />
                        ) : (
                          itemData.name
                        )}
                      </span>
                    </TreeItemLabel>
                  </TreeItem>
                </DirectoryContext>
              );
            }
            return (
              <Link key={item.getId()} to={`/notebook?id=${itemData.id.replace('note-', '')}`}>
                
                <TreeItem
                  className="bg-none"
                  item={item}

                  style={{ cursor: "pointer" }}
                >
                  <TreeItemLabel className="dark:bg-zinc-900 bg-sidebar">
                    <span className="flex items-center gap-2">
                      <FileIcon className="text-muted-foreground pointer-events-none size-4" />
                      {itemData.name}
                    </span>
                  </TreeItemLabel>
                </TreeItem>
              </Link>
            );
          })}
        </Tree>
      </ScrollArea>
    </div>
  )
}

// ... buildItemsFromTree e indent ...

const indent = 20

interface NoteType {
  id: string;
  title: string;
}

function buildItemsFromTree(
  dirs: DirectoryDataType[],
  rootNotes: NoteType[]
): Record<string, DirectoryItem> {
  const itemsMap: Record<string, DirectoryItem> = {};

  itemsMap.root = {
    id: "root",
    name: "Root",
    type: "directory",
    children: [],
  };

  function processDir(dir: DirectoryDataType, parentId: string) {
    const id = dir.id.toString();
    itemsMap[id] = {
      id,
      name: dir.title,
      type: "directory",
      children: [],
    };

    if (!itemsMap[parentId].children) itemsMap[parentId].children = [];
    itemsMap[parentId].children!.push(id);

    dir.notes.forEach((note) => {
      const noteId = `note-${note.id}`;
      itemsMap[noteId] = {
        id: noteId,
        name: note.title,
        type: "note",
      };
      itemsMap[id].children!.push(noteId);
    });

    if (Array.isArray(dir.childrens)) {
      dir.childrens.forEach((childDir) => processDir(childDir, id));
    }
  }

  dirs.forEach((dir) => processDir(dir, "root"));
  rootNotes.forEach((note) => {
    const noteId = `note-${note.id}`;
    itemsMap[noteId] = {
      id: noteId,
      name: note.title,
      type: "note",
    };
    itemsMap.root.children!.push(noteId);
  });

  return itemsMap;
}