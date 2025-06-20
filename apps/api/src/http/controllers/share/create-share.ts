import { AlredySharedError } from "@/use-cases/errors/alredy-shared-error";
import { NoteNotFoundError } from "@/use-cases/errors/note-note-found-error";
import { UnauthorizedNoteError } from "@/use-cases/errors/unauthorized-note-error";
import { makeCreateShareUseCase } from "@/use-cases/factories/share/make-create-share-use-case";
import type { FastifyReply, FastifyRequest } from "fastify";
import z from "zod";

export async function createShare(request: FastifyRequest, reply: FastifyReply){
  const createShareSchema = z.object({
    noteId: z.string(),
  });

  const { noteId } = createShareSchema.parse(request.body);
  
  try{
    const useCase = makeCreateShareUseCase();

    const share = await useCase.create({
      authorId: request.user.sub,
      noteId,
    });

    return reply.status(201).send({
      share,
    });
  }catch(err){
    if(err instanceof NoteNotFoundError){
      return reply.status(404).send({
        message: err.message,
      });
    }
    if(err instanceof UnauthorizedNoteError){
      return reply.status(401).send({
        message: err.message,
      });
    }
    if(err instanceof AlredySharedError){
      return reply.status(400).send({
        message: err.message,
      });
    }

    return reply.status(500).send({
      message: err,
    });
  }
}