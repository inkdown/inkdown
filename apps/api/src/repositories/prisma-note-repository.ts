import type { Prisma, Note } from "@prisma/client";
import type { NoteRepository } from "./note-repository";
import { prisma } from "@/lib/prisma";

export class PrismaNoteRepository implements NoteRepository{

  async delete(id: string): Promise<void> {
    await prisma.note.delete({
      where: {
        id,
      },
    });
  };

  async findById(id: string): Promise<Note | null> {
    const note = await prisma.note.findUnique({
      where: {
        id,
      },
      include: {
        Directory: {
          select: {
            title: true,
            parent: {
              select: {
                title: true,
              }
            }
          },
        } 
      }
    });
    return note;
  }
  
  async create(data: Prisma.NoteUncheckedCreateInput): Promise<Note> {
    const note = await prisma.note.create({
      data
    });

    return note;
  }
  async findByUserId(authorId: string): Promise<Note[] | null> {
    const notes = await prisma.note.findMany({
      select: {
        id: true,
        title: true,
        content: true,
        createdAt: true,
        /* reactions: {
          select: {
            type: true
          }
        }, */
        /* Share: {
          select: {
            author: true,
          }
        },
        type: true,
        author_id: true,
        _count:{
          select:{
            reactions: true,
            Share: true,
          }
        } */
      },
      where: {
        author_id: authorId,
        directoryId: null
      }
      
    });
    console.log(notes);
    const note = await prisma.note.findMany({
        where: {
          author_id: authorId
        },
      });

    return note;
  }
  async update(data: { title?: string, content?: string, type?: string, id: string, archived?: boolean}): Promise<void> {
      await prisma.note.update({
        where: {
          id: data.id,
        },
        data,
      });
  };
  async findAuthorsWithoutDir(authorId: string): Promise<Note[]> {
    return await prisma.note.findMany({
      where: {
        author_id: authorId,
        directoryId: null,
      },
    });
  }
}