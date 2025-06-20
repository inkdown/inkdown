import type { PrismaReactionRepository } from "@/repositories/prisma-reaction-repository";
import { ReactionNotFoundError } from "../errors/reaction-not-found-error";

interface DeleteReactionRequest {
  authorId: string,
  reactionId: number,
}
export class DeleteReactionUseCase {
  constructor(private repository: PrismaReactionRepository) { };

  async delete({
    authorId, reactionId
  }: DeleteReactionRequest) {
    const reaction = await this.repository.findById(reactionId);

    if (!reaction) {
      throw new ReactionNotFoundError();
    }

    if (reaction.author_id !== authorId) {
      throw new Error("Cant delete a reaction that is not yours");
    }

    await this.repository.delete(reaction);
  }
