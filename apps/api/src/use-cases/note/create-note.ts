import type { AuthorsRepository } from "@/repositories/author-repository";
import type { NoteRepository } from "@/repositories/note-repository";
import { AccountNotFoundEror } from "../errors/account-not-found-error";

interface CreateNoteUseCaseRequest {
  title: string,
  authorId: string,
  dirId: number | null
};


export class CreateNoteUseCase {
  constructor(private repository: NoteRepository, private authorRepository: AuthorsRepository) { }

  async create({
    title, authorId, dirId
  }: CreateNoteUseCaseRequest) {

    const author = await this.authorRepository.findById(authorId);

    if (!author) {

      throw new AccountNotFoundEror([authorId]);
    }
    console.log("Achou o ator");

    const note = await this.repository.create({
      title,
      content: "",
      type: "PRIVATE",
      author_id: authorId,
      directoryId: dirId
    });

    return note;
  }
}