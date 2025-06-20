import { PrismaDirectoryRepository } from "@/repositories/prisma-directory-repository";
import { RenameDirectoryUseCase } from "@/use-cases/directory/rename-directory-use-case";

export default function makeRenameDirectory(){
  const repo = new PrismaDirectoryRepository();

  return new RenameDirectoryUseCase(repo);
}