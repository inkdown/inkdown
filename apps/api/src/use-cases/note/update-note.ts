import type { PrismaAuthorRepository } from "@/repositories/prisma-author-repository";
import type { PrismaNoteRepository } from "@/repositories/prisma-note-repository";
import { InvalidDataError } from "../errors/invalid-data-error";

interface UpdateNoteRequest {
  id: string,
  title?: string,
  content?: string,
  type?: string,
  icon?: string,
  archived?: boolean
}

export class UpdateNoteUseCase{
  constructor(private repository: PrismaNoteRepository, private authorRepository: PrismaAuthorRepository){}

  async update(data: UpdateNoteRequest){
    const note = await this.repository.findById(data.id);

    if(!note){
      throw new InvalidDataError(data.id);
    }

    await this.repository.update(
      data,
    );
  };
};