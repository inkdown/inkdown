import type { Note, Prisma } from "@prisma/client";

export interface NoteRepository{
  create(data: Prisma.NoteUncheckedCreateInput): Promise<Note>;
  findByUserId(userId: string): Promise<Note[] | null>;
  update(data: Note): Promise<void>;
  findById(id: string): Promise<Note | null>;
  delete(id: string): Promise<void>;
}