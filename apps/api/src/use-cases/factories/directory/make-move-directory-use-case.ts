import { PrismaDirectoryRepository } from "@/repositories/prisma-directory-repository";
import { MoveDirectoryUseCase } from "@/use-cases/directory/move-directory-use-case";

export default function makeMoveDirectoryUseCase(){
  const repo = new PrismaDirectoryRepository();

  return new MoveDirectoryUseCase(repo);
}