import type { Directory, Prisma } from "@prisma/client";
import type { DirectoryWithRelations } from "./prisma-directory-repository";

export interface DirectoryRepository {
   create(data: Prisma.DirectoryCreateInput): Promise<Directory>;
   findById(id: number): Promise<Directory | null>;
   delete(id: number): Promise<void>;
   renameDir(newName: string, id: number): Promise<void>;
   getByAuthor(authorId: string): Promise<DirectoryWithRelations[]>;
   moveDir(directory: Directory): Promise<void>;
}