import type { PrismaNoteRepository } from "@/repositories/prisma-note-repository";
import { NoteNotFoundError } from "../errors/note-note-found-error";
import { UnauthorizedNoteDeletionError } from "../errors/unauthorized-note-deletion-error";

interface DeleteNoteRequest {
  id: string,
  authorId: string,
};

export class DeleteNoteUseCase{
  constructor(private repository: PrismaNoteRepository){}

  async delete({
    id, authorId
  }: DeleteNoteRequest){
    const note = await this.repository.findById(id);

    if(!note){
      throw new NoteNotFoundError();
    }

    if(note.author_id !== authorId){
      throw new UnauthorizedNoteDeletionError();
    }

    await this.repository.delete(id);
  }
}