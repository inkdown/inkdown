import type { Prisma, Share } from "@prisma/client";

export interface ShareRespository{
  create(data: Prisma.ShareUncheckedCreateInput): Promise<Share>;
  delete(data: Share): Promise<void>;
  findById(id: number): Promise<Share | null>;
  findByNoteAndAuthor(noteId: string, authorId: string): Promise<Share | null>;
}