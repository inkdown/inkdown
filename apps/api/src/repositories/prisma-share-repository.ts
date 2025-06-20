import type { Prisma, Share } from "@prisma/client";
import type { ShareRespository } from "./share-repository";
import { prisma } from "@/lib/prisma";

export class PrismaShareRepository implements ShareRespository{
  
  async findByNoteAndAuthor(noteId: string, authorId: string): Promise<Share | null> {
    const share = await prisma.share.findFirst({
      where: {
        note_id: noteId,
        author_id: authorId,
      },
    });

    return share;
  }
  
  async create(data: Prisma.ShareUncheckedCreateInput): Promise<Share> {
    const share = await prisma.share.create({
      data,
    });
    return share; 
  }
  async delete(data: Share): Promise<void> {
    await prisma.share.delete({
      where: {
        id: data.id,
      },
    });
  }

  async findById(id: number): Promise<Share | null> {
    const share = await prisma.share.findUnique({
      where: {
        id,
      },
    });

    return share;
  }
  
}