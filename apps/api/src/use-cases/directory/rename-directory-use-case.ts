import type { DirectoryRepository } from "@/repositories/directory-repository";
import { DirectoryNotFoundError } from "../errors/directory-not-found-error";
import { UnnauthorizedDirectoryError } from "../errors/unnauthorized-directory-error";

interface RenameDirectoryRequest {
  newTitle: string,
  dirId: number,
  authorId: string,
};

export class RenameDirectoryUseCase {
  constructor(private repo: DirectoryRepository){}

  async rename({
    newTitle,
    dirId,
    authorId
  }: RenameDirectoryRequest){
    const directory = await this.repo.findById(dirId);

    if(!directory){
      throw new DirectoryNotFoundError("Could not found the directory by this id " + dirId);
    }

    if(directory.authorId !== authorId){
      throw new UnnauthorizedDirectoryError("Cannot rename a directory that does not belong to the author with id " + authorId);
    }
    console.log(newTitle, dirId);
    await this.repo.renameDir(newTitle, dirId);
  }

}