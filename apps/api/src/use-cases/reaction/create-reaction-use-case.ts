import type { PrismaNoteRepository } from "@/repositories/prisma-note-repository";
import type { PrismaReactionRepository } from "@/repositories/prisma-reaction-repository";
import { NoteNotFoundError } from "../errors/note-note-found-error";
import { UnauthorizedNoteError } from "../errors/unauthorized-note-error";
import { UnauthorizedReactionError } from "../errors/unauthorized-reaction-error";

interface CreateReactionRequest {
  type: string,
  authorId: string,
  noteId: string,
};

export class CreateReactionUseCase{
  constructor(
    private repository: PrismaReactionRepository, 
    private noteRepository: PrismaNoteRepository 
  ){}

  async create({
    type, authorId, noteId,
  }: CreateReactionRequest){
    const note = await this.noteRepository.findById(noteId);

    if(!note){
      throw new NoteNotFoundError();
    }

    if(note.type === "PRIVATE"){
      throw new UnauthorizedNoteError();
    }

    const reactionAlredyExists = await this.repository.findByNoteAndAuthor( noteId, authorId );

    if(reactionAlredyExists){
      throw new UnauthorizedReactionError();
    }

    const reaction = await this.repository.create({
      type, author_id: authorId, note_id: noteId
    });

    return reaction;
  }
}