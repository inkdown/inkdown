import type { Directory, Note } from "@prisma/client";

export type DirectoryWithChildren = Directory & {
  notes: Note[];
  childrens: DirectoryWithChildren[];
};