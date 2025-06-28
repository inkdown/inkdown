import type { PrismaTagRepository } from "@/repositories/prisma-tag-repository";

interface CreateTagRequest {
  name: string,
  color: string,
  authorId: string,
};

export class CreateTagUsecase {
  constructor(private repo: PrismaTagRepository) { };

  async create({
    name,
    color,
    authorId,
  }: CreateTagRequest){

  }

}