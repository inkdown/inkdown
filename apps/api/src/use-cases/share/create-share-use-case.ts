import type { PrismaNoteRepository } from "@/repositories/prisma-note-repository";
import type { PrismaShareRepository } from "@/repositories/prisma-share-repository";
import { NoteNotFoundError } from "../errors/note-note-found-error";
import { AlredySharedError } from "../errors/alredy-shared-error";
import { UnauthorizedNoteError } from "../errors/unauthorized-note-error";


interface CreateShareRequest {
  authorId: string,
  noteId: string,
};

export class CreateShareUseCase{
  constructor(private repository: PrismaShareRepository, private noteRepository: PrismaNoteRepository){};

  async create({
    authorId, noteId
  }: CreateShareRequest){
    const note = await this.noteRepository.findById(noteId);

    if(!note){
      throw new NoteNotFoundError();
    }

    if(note.type === "PRIVATE") {
      throw new UnauthorizedNoteError();
    }

    const alredyShared = await this.repository.findByNoteAndAuthor(noteId, authorId);

    if(alredyShared){
      throw new AlredySharedError();
    }

    const share = await this.repository.create({
      author_id: authorId,
      note_id: noteId,
    });

    return share;
  }
}