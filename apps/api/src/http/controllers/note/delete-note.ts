import { NoteNotFoundError } from "@/use-cases/errors/note-note-found-error";
import { makeDeleteNoteUseCase } from "@/use-cases/factories/note/make-delete-note-use-case";
import type { FastifyReply, FastifyRequest } from "fastify";
import z from "zod";

export async function deleteNote(request: FastifyRequest, reply: FastifyReply){
  const deleteNoteSchema = z.object({
    id: z.string(),
  });

  const { id } = deleteNoteSchema.parse(request.query);

  try{
    const useCase = makeDeleteNoteUseCase();

    await useCase.delete({
      id,
      authorId: request.user.sub,
    });

    return reply.status(204).send();
  }catch(err){
    if(err instanceof NoteNotFoundError){
      return reply.status(404).send({
        message: err.message,
      });
    }

    return reply.status(500).send();
  };
}