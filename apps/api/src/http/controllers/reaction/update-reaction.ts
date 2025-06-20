import { ReactionNotFoundError } from "@/use-cases/errors/reaction-not-found-error";
import { makeUpdateReactionUseCase } from "@/use-cases/factories/reaction/make-update-reaction-use-case";
import type { FastifyReply, FastifyRequest } from "fastify";
import z from "zod";

export async function updateReaction(request: FastifyRequest, reply: FastifyReply){
  const updateReactionSchema = z.object({
    reactionId: z.number(),
    type: z.enum(["LOVED", "APPLAUSED", "LIKED"]),
  });

  const { reactionId, type } = updateReactionSchema.parse(request.body);

  try{
    const useCase = makeUpdateReactionUseCase();

    await useCase.update({
      reactionId, type
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