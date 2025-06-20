import { PrismaReactionRepository } from "@/repositories/prisma-reaction-repository";
import { UpdateReactionUseCase } from "@/use-cases/reaction/update-reaction-use-case";

export function makeUpdateReactionUseCase(){
  const repo = new PrismaReactionRepository();
  
  return new UpdateReactionUseCase(repo);
}