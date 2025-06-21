import type { DirectoryWithRelations, PrismaDirectoryRepository } from "@/repositories/prisma-directory-repository";
import type { DirectoryWithChildren } from "@/types/directory-types";

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

  buildDirectoryTree(flatList: DirectoryWithRelations[]): DirectoryWithChildren[] {
    const idToDirMap: Record<number, DirectoryWithChildren> = {};
    const roots: DirectoryWithChildren[] = [];

    flatList.forEach(dir => {
      idToDirMap[dir.id] = {
        ...dir,
        childrens: [],
        notes: dir.notes || []
      };
    });

    flatList.forEach(dir => {
      if (dir.parentId === null) {
        roots.push(idToDirMap[dir.id]);
      } else {
        const parent = idToDirMap[dir.parentId];
        if (parent) {
          parent.childrens.push(idToDirMap[dir.id]);
        }
      }
    });

    return roots;
  }
}