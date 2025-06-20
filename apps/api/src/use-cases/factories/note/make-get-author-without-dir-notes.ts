import { PrismaNoteRepository } from "@/repositories/prisma-note-repository";
import { GetAuthorWithoutDirNotes } from "@/use-cases/note/get-author-without-dir-notes";

export function makeGetAuthorWithoutDirNotes() {
  const repo = new PrismaNoteRepository();

  return new GetAuthorWithoutDirNotes(repo); 
}