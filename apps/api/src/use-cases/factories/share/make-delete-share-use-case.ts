import { PrismaShareRepository } from "@/repositories/prisma-share-repository";
import { DeleteShareUseCase } from "@/use-cases/share/delete-share-use-case";

export function makeDeleteShareUseCase(){
  const repo = new PrismaShareRepository();

  return new DeleteShareUseCase(repo);
}