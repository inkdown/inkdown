import type { AuthorsRepository } from "@/repositories/author-repository";
import type { NoteRepository } from "@/repositories/note-repository";
import { AccountNotFoundEror } from "../errors/account-not-found-error";

interface CreateNoteUseCaseRequest {
  title: string,
  content: string,
  type: string,
  authorId: string,
  icon: string,
  dirId: number | undefined
};


export class CreateNoteUseCase {
  constructor(private repository: NoteRepository, private authorRepository: AuthorsRepository) { }

  async create({
    title, content, type, authorId, icon, dirId
  }: CreateNoteUseCaseRequest) {

    const author = await this.authorRepository.findById(authorId);

    if (!author) {

      throw new AccountNotFoundEror([authorId]);
    }
    console.log("Achou o ator");

    const note = await this.repository.create({
      title,
      content,
      type,
      icon,
      author_id: authorId,
      directoryId: dirId
    });

    return note;
  }
}