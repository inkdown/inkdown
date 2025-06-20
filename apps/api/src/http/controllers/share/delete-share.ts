import { ShareNotFoundError } from "@/use-cases/errors/share-note-found-error";
import { UnauthorizedShareDeletionError } from "@/use-cases/errors/unauthorized-share-deletion-error";
import { makeDeleteShareUseCase } from "@/use-cases/factories/share/make-delete-share-use-case";
import type { FastifyReply, FastifyRequest } from "fastify";
import z from "zod";

export async function deleteShare(request: FastifyRequest, reply: FastifyReply){
  const deleteShareSchema = z.object({
    id: z.string(),
  });

  const { id } = deleteShareSchema.parse(request.query);
  console.log(id);

  try{
    const useCase = makeDeleteShareUseCase();

    await useCase.delete({
      authorId: request.user.sub,
      shareId: Number(id),
    });

    return reply.status(204).send();
  }catch(err){
    if(err instanceof ShareNotFoundError){
      return reply.status(404).send({
        message: err.message,
      });
    }
    if(err instanceof UnauthorizedShareDeletionError){
      return reply.status(401).send({
        message: err.message,
      });
    }
    return reply.status(500).send({
      message: err,
    });
  }
}