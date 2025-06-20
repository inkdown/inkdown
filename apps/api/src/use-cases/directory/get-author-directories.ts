import type { PrismaDirectoryRepository } from "@/repositories/prisma-directory-repository";
import type { DirectoryWithChildren } from "@/types/directory-types";
import type { Directory } from "@prisma/client";

interface GetAuthorDirectoriesRequest {
  authorId: string
};

export class GetAuthorDirectories {
  constructor(private repo: PrismaDirectoryRepository) { }

  async get({ authorId }: GetAuthorDirectoriesRequest) {
    const directories = await this.repo.getByAuthor(authorId) as DirectoryWithChildren[];

    const tree = this.buildDirectoryTree(directories);

    return tree;
  }

  buildDirectoryTree(flatList: DirectoryWithChildren[]): DirectoryWithChildren[] {
    const idToDirMap: { [id: number]: DirectoryWithChildren } = {};
    const roots: DirectoryWithChildren[] = [];

    for (const dir of flatList) {
      idToDirMap[dir.id] = {
        ...dir,
        childrens: [],
      };
    }

    for (const dir of flatList) {
      if (dir.parentId === null) {
        roots.push(idToDirMap[dir.id]);
      } else {
        const parent = idToDirMap[dir.parentId];
        if (parent) {
          parent.childrens!.push(idToDirMap[dir.id]);
        }
      }
    }

    return roots;
  }
}