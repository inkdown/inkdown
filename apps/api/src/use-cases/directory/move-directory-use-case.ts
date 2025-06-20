import type { PrismaDirectoryRepository } from "@/repositories/prisma-directory-repository";
import { DirectoryNotFoundError } from "../errors/directory-not-found-error";
import { UnnauthorizedDirectoryError } from "../errors/unnauthorized-directory-error";

interface MoveDirectoryRequest {
  directoryId: number,
  parentId: number | null,
  authorId: string,
};

export class MoveDirectoryUseCase {
  constructor(private repo: PrismaDirectoryRepository){};

  async move({
    directoryId,
    parentId,
    authorId,
  }: MoveDirectoryRequest){
    let parent = null;
    const directory = await this.repo.findById(directoryId);

    if(!directory) {
      throw new DirectoryNotFoundError("Cannot move a directory that does not exists.");
    };

    if(directory.authorId !== authorId) {
      throw new UnnauthorizedDirectoryError("Cant move a directory that does not belong to this user");
    };

    if(parentId !== null) {
      parent = await this.repo.findById(parentId);

      if(!parent){
        throw new DirectoryNotFoundError("Could not move the directory. The new directory destination does not exists");
      }; 
    };

    directory.parentId = parentId;

    await this.repo.moveDir(directory);
  }
}