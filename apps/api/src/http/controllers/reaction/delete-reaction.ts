import { ReactionNotFoundError } from "@/use-cases/errors/reaction-not-found-error";
import { makeDeleteReactionUseCase } from "@/use-cases/factories/reaction/make-delete-reaction-use-case";
import type { FastifyReply, FastifyRequest } from "fastify";
import z from "zod";

export async function deleteReaction(request: FastifyRequest, reply: FastifyReply){
  const deleteReactionSchema = z.object({
    reactionId: z.number(),
  });

  const { reactionId } = deleteReactionSchema.parse(request.query);

  try{

    const useCase = makeDeleteReactionUseCase();

    await useCase.delete({
      authorId: request.user.sub,
      reactionId,
    });

    return reply.status(204).send();
  }catch(err){
    if(err instanceof ReactionNotFoundError){
      return reply.status(404).send({
        message: err.message,
      });
    }

    return reply.status(500).send({
      message: err,
    });
  }
}