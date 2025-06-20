import type { DirectoryRepository } from "@/repositories/directory-repository";
import { InvalidDirectoryError } from "../errors/invalid-directory-data-error";

interface CreateDirectoryRequest {
  title: string,
  authorId: string,
  parentId: number | undefined
};

export class CreateDirectory {
  constructor(private repository: DirectoryRepository) { };


  async create({
    title,
    authorId,
    parentId
  }: CreateDirectoryRequest) {
    let parent = undefined;

    if (parentId) {
      parent = await this.repository.findById(parentId);
      if (!parent) {
        throw new InvalidDirectoryError("O id do parente não referencia a nenhuma entidade");
      };
    }

    await this.repository.create({
      title,
      Author: {
        connect: {
          id: authorId,
        },
      },
      parent: parentId ? { connect: { id: parentId } } : undefined,
    });

  };

}