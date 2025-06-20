import type { PrismaReactionRepository } from "@/repositories/prisma-reaction-repository";
import { ReactionNotFoundError } from "../errors/reaction-not-found-error";

interface UpdateReactionRequest {
  reactionId: number,
  type: string,
};


export class UpdateReactionUseCase{
  constructor(private repository: PrismaReactionRepository){};

  async update({
    reactionId, type
  }: UpdateReactionRequest){
    const reaction = await this.repository.findById(reactionId);

    if(!reaction){
      throw new ReactionNotFoundError();
    }

    if(reaction.type === type){
      return;
    }

    await this.repository.update(reactionId, type);
  }
}