import { NoteNotFoundError } from "@/use-cases/errors/note-note-found-error";
import { UnauthorizedNoteError } from "@/use-cases/errors/unauthorized-note-error";
import { UnauthorizedReactionError } from "@/use-cases/errors/unauthorized-reaction-error";
import { makeCreateReactUseCase } from "@/use-cases/factories/reaction/make-create-reaction-use-case";
import type { FastifyReply, FastifyRequest } from "fastify";
import z from "zod";

export async function createReaction(request: FastifyRequest, reply: FastifyReply){
  const createReactionSchema = z.object({
    type: z.enum(["LOVED", "APPLAUSED", "LIKED"]),
    noteId: z.string(),
  });

  const { type, noteId } = createReactionSchema.parse(request.body);

  try{
    const useCase = makeCreateReactUseCase();

    const react = await useCase.create({
      type, authorId: request.user.sub, noteId
    });

    return reply.status(201).send({
      react,
    });
  }catch(err){
    if(err instanceof UnauthorizedReactionError){
      reply.status(401).send({
        message: err.message,
      });
    };
    if(err instanceof NoteNotFoundError){
      reply.status(404).send({
        message: err.message,
      });
    }
    if(err instanceof UnauthorizedNoteError){
      reply.status(401).send({
        message: err.message,
      });
    }
  }
}