import { PrismaNoteRepository } from "@/repositories/prisma-note-repository";
import { GetNoteUseCase } from "@/use-cases/note/get-note-use-case";

export function makeGetNoteUseCase(){
  const repo = new PrismaNoteRepository();

  return new GetNoteUseCase(repo);
  }