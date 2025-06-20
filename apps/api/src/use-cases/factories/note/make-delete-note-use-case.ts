import { PrismaNoteRepository } from "@/repositories/prisma-note-repository";
import { DeleteNoteUseCase } from "@/use-cases/note/delete-note";

export function makeDeleteNoteUseCase(){
  const repository = new PrismaNoteRepository();
  return new DeleteNoteUseCase(repository);
}