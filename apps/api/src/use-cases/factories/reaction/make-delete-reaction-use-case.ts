import { PrismaReactionRepository } from "@/repositories/prisma-reaction-repository";
import { DeleteReactionUseCase } from "@/use-cases/reaction/delete-reaction-use-case";

export function makeDeleteReactionUseCase(){
  const repo = new PrismaReactionRepository();

  return new DeleteReactionUseCase(repo);
}