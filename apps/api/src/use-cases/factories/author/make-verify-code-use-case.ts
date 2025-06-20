import { PrismaAuthorRepository } from "@/repositories/prisma-author-repository";
import { VerifyCodeUseCase } from "@/use-cases/author/verify-code-use-case";

export function makeVerifyCodeUseCase(){
  const repo = new PrismaAuthorRepository();

  return new VerifyCodeUseCase(repo);
}