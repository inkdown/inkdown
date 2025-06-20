import { PrismaDirectoryRepository } from "@/repositories/prisma-directory-repository";
import { GetAuthorDirectories } from "@/use-cases/directory/get-author-directories";

export default function makeGetAuthorDirectoriesUseCase(){
  const repo = new  PrismaDirectoryRepository();

  return new GetAuthorDirectories(repo);
}