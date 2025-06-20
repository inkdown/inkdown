import type { Prisma, Reaction } from "@prisma/client";
import type { ReactionRepository } from "./reaction-repository";
import { prisma } from "@/lib/prisma";

export class PrismaReactionRepository implements ReactionRepository {
  
  async findByNoteAndAuthor(noteId: string, authorId: string): Promise<Reaction | null> {
    const reaction = await prisma.reaction.findFirst({
      where: {
        author_id: authorId,
        note_id: noteId,
      }
    });

    return reaction;
  }

  async create(data: Prisma.ReactionUncheckedCreateInput): Promise<Reaction> {
    const reaction = await prisma.reaction.create({
      data,
    });

    return reaction;
  }
  async findById(id: number): Promise<Reaction | null> {
    const reaction = await prisma.reaction.findUnique({
      where: {
        id,
      },
    });

    return reaction;
  }
  async findByNote(id: string): Promise<Reaction[] | null> {
    const reaction = await prisma.reaction.findMany({
      where: {
        note_id: id,
      },
    });

    return reaction;
  }
  async findByUser(id: string): Promise<Reaction[] | null> {
    const reaction = await prisma.reaction.findMany({
      where: {
        note: {
          author_id: id,
        },
      },
    });

    return reaction;
  };
  async delete(data: Reaction): Promise<void> {
    await prisma.reaction.delete({
      where: {
        id: data.id,
      }
    });
  }
  async update(id: number, type: string): Promise<void> {
    await prisma.reaction.update({
      where: {
        id
      },
      data: {
        type,
      },
    });    
  }
  
}