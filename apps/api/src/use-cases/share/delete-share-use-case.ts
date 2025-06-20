import type { PrismaShareRepository } from "@/repositories/prisma-share-repository";
import { ShareNotFoundError } from "../errors/share-note-found-error";
import { UnauthorizedShareDeletionError } from "../errors/unauthorized-share-deletion-error";

interface DeleteShareRequest{
  shareId: number,
  authorId: string,
};

export class DeleteShareUseCase{
  constructor(private repository: PrismaShareRepository){};

  async delete({
    shareId, authorId
  }: DeleteShareRequest){
    const share = await this.repository.findById(shareId);

    if(!share){
      throw new ShareNotFoundError();
    }

    if(share.author_id !== authorId){
      throw new UnauthorizedShareDeletionError();
    }

    await this.repository.delete(share);
  }
}