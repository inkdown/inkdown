import type { PrismaAuthorRepository } from "@/repositories/prisma-author-repository";

interface GetAuthorDataRequest {
  authorId: string,
}

export class GetAuthorDataUsecase {
  constructor(private repo: PrismaAuthorRepository) {};

  async get({
    authorId
  }: GetAuthorDataRequest){ 
    return await this.repo.getUserData(authorId);
  }
}