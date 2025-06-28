import { PrismaTagRepository } from "@/repositories/prisma-tag-repository";
import { CreateTagUsecase } from "@/use-cases/tag/create-tag-use-case";

export function makeCreateTagUsecase() {
  const repo = new PrismaTagRepository();

  return new CreateTagUsecase(repo);
}