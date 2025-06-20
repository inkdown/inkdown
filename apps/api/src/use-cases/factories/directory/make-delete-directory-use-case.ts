import { PrismaDirectoryRepository } from "@/repositories/prisma-directory-repository";
import { DeleteDirectoryUseCase } from "@/use-cases/directory/delete.directory-use-case";

export function makeDeleteDirectoryUseCase(){
  const repo = new PrismaDirectoryRepository();

  return new DeleteDirectoryUseCase(repo);
}