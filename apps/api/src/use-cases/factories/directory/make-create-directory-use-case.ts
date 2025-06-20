import { PrismaDirectoryRepository } from "@/repositories/prisma-directory-repository";
import { CreateDirectory } from "@/use-cases/directory/create-directory-use-case";

export function makeCreateDirectory() {
  const repo = new PrismaDirectoryRepository();

  return new CreateDirectory(repo);
}