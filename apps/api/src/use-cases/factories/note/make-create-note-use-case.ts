import { PrismaNoteRepository } from "@/repositories/prisma-note-repository";
import { CreateNoteUseCase } from "@/use-cases/note/create-note";
import { PrismaAuthorRepository } from "@/repositories/prisma-author-repository";

export function makeCreateNoteUseCase(){
  const repository = new PrismaNoteRepository();
  const authorRepository = new PrismaAuthorRepository();
  return new CreateNoteUseCase(repository, authorRepository);
}