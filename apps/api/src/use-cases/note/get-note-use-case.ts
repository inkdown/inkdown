import type { PrismaNoteRepository } from "@/repositories/prisma-note-repository";
import { NoteNotFoundError } from "../errors/note-note-found-error";
import { UnauthorizedNoteError } from "../errors/unauthorized-note-error";

interface GetNoteRequest {
  noteId: string,
  authorId: string,
}

export class GetNoteUseCase{
  constructor(private repo: PrismaNoteRepository){};

  async get({
    noteId, authorId
  }: GetNoteRequest){
    const note = await this.repo.findById(noteId);

    if(!note){
      throw new NoteNotFoundError();
    }

    if(note.author_id !== authorId){
      throw new UnauthorizedNoteError();
    }

    return note;
  }
}