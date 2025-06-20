import { PrismaAuthorRepository } from "@/repositories/prisma-author-repository";
import { PrismaNoteRepository } from "@/repositories/prisma-note-repository";
import { UpdateNoteUseCase } from "@/use-cases/note/update-note";

export function makeUpdateNoteUseCase(){
  const repository = new PrismaNoteRepository();
  const authorRepository = new PrismaAuthorRepository();

  return new UpdateNoteUseCase(repository, authorRepository);
}