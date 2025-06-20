import type { DirectoryRepository } from "@/repositories/directory-repository";
import { DirectoryNotFoundError } from "../errors/directory-not-found-error";
import { UnnauthorizedDirectoryError } from "../errors/unnauthorized-directory-error";

interface DeleteDirectoryRequest{
  dirId: number,
  authorId: string,
};

export class DeleteDirectoryUseCase{
  constructor(private repo: DirectoryRepository){}

  async delete({
    dirId,
    authorId
  }: DeleteDirectoryRequest){
    const dir = await this.repo.findById(dirId);

    if(!dir){;
      throw new DirectoryNotFoundError("Director for the deletion not found with id: " + dirId);
    };

    if(dir.authorId !== authorId){
      throw new UnnauthorizedDirectoryError("Could not delete the directory that does not belong to the author: " + authorId);
    };

    await this.repo.delete(dir.id);
  };

}