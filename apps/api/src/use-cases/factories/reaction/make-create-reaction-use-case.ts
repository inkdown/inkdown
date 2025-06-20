import { PrismaNoteRepository } from "@/repositories/prisma-note-repository";
import { PrismaReactionRepository } from "@/repositories/prisma-reaction-repository";
import { CreateReactionUseCase } from "@/use-cases/reaction/create-reaction-use-case";

export function makeCreateReactUseCase(){
  const repo = new PrismaReactionRepository();
  const noteRepo = new PrismaNoteRepository();

  return new CreateReactionUseCase(repo,noteRepo);
}