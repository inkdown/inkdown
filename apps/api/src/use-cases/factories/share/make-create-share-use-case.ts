import { PrismaNoteRepository } from "@/repositories/prisma-note-repository";
import { PrismaShareRepository } from "@/repositories/prisma-share-repository";
import { CreateShareUseCase } from "@/use-cases/share/create-share-use-case";

export function makeCreateShareUseCase(){
  const repo = new PrismaShareRepository();
  const noteRepo = new PrismaNoteRepository();

  return new CreateShareUseCase(repo, noteRepo);
}