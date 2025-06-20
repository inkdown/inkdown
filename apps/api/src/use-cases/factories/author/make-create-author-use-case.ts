import { PrismaAuthorRepository } from "@/repositories/prisma-author-repository";
import { CreateAuthorUseCase } from "@/use-cases/author/create-author";

export function makeCreateAuthorUseCase(){
  const repository = new PrismaAuthorRepository();
  const useCase = new CreateAuthorUseCase(repository);

  return useCase;
}