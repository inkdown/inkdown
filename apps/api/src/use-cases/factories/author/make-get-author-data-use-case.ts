import { PrismaAuthorRepository } from "@/repositories/prisma-author-repository";
import { GetAuthorDataUsecase } from "@/use-cases/author/get-author-data";

export function makeGetAuthorDataUsecase () {
  const repo = new PrismaAuthorRepository();

  return new GetAuthorDataUsecase(repo);
}