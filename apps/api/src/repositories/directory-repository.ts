import type { Directory, Prisma } from "@prisma/client";

export interface DirectoryRepository {
   create(data: Prisma.DirectoryCreateInput): Promise<Directory>;
   findById(id: number): Promise<Directory | null>;
   delete(id: number): Promise<void>;
   renameDir(newName: string, id: number): Promise<void>;
   getByAuthor(authorId: string): Promise<Directory[]>;
   moveDir(directory: Directory): Promise<void>;
}