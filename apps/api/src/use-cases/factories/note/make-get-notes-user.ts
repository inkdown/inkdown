import { PrismaAuthorRepository } from "@/repositories/prisma-author-repository";
import { PrismaNoteRepository } from "@/repositories/prisma-note-repository";
import { GetNotesByAuthor} from "@/use-cases/note/get-notes-by-user";

export function makeGetNotesAuthor(){
  const repository = new PrismaNoteRepository();
  const authorRepository = new PrismaAuthorRepository();

  return new GetNotesByAuthor(repository, authorRepository);
}