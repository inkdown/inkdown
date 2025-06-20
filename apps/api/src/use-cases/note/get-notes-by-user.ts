import type { PrismaAuthorRepository } from "@/repositories/prisma-author-repository";
import type { PrismaNoteRepository } from "@/repositories/prisma-note-repository";
import { AccountNotFoundEror } from "../errors/account-not-found-error";

interface GetNotesByUserRequest {
  userId: string,
}

export class GetNotesByAuthor{
  constructor(private repository: PrismaNoteRepository, private authorRepository: PrismaAuthorRepository){}

  async get({
    userId
  }: GetNotesByUserRequest){
    const author = await this.authorRepository.findById(userId);

    if(!author){
      throw new AccountNotFoundEror([userId]);
    };

    const notes = await this.repository.findByUserId(userId);

    return notes || [];
  }
}