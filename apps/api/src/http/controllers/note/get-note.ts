import { NoteNotFoundError } from "@/use-cases/errors/note-note-found-error";
import { UnauthorizedNoteError } from "@/use-cases/errors/unauthorized-note-error";
import { makeGetNoteUseCase } from "@/use-cases/factories/note/make-get-note-use-case";
import type { FastifyReply, FastifyRequest } from "fastify";
import z from "zod";

export async function getNote(request: FastifyRequest, reply: FastifyReply){
  const getNoteSchema = z.object({
    noteId: z.string(),
  });

  const { noteId } = getNoteSchema.parse(request.query);

  const authorId = request.user.sub;

  console.log("ID DO AUHTOR" + authorId);

  try{
    const useCase = makeGetNoteUseCase();

    const note = await useCase.get({
      noteId,
      authorId,
    });

    return reply.status(200).send({
      note,
    });
  }catch(err){
    if(err instanceof NoteNotFoundError){
      return reply.status(404).send({
        message: err.message
      });
    }

    if(err instanceof UnauthorizedNoteError){
      return reply.status(401).send({
        message: err.message
      });
    }
  }
}