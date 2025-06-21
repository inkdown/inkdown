import { AccountNotFoundEror } from "@/use-cases/errors/account-not-found-error";
import { InvalidPublicNoteContent } from "@/use-cases/errors/invalid-public-note-content";
import { makeCreateNoteUseCase } from "@/use-cases/factories/note/make-create-note-use-case";
import type { FastifyReply, FastifyRequest } from "fastify";
import z from "zod";

export async function createNote(request: FastifyRequest, reply: FastifyReply) {
  const createNoteSchema = z.object({
    title: z.string(),
    dirId: z.number().int().nullable()
  });

  const { title, dirId } = createNoteSchema.parse(request.body);

  try {
    const useCase = makeCreateNoteUseCase();

    const note = await useCase.create({
      title,
      authorId: request.user.sub,
      dirId
    });

    return reply.status(201).send({
      note
    });
  } catch (err) {
    if (err instanceof InvalidPublicNoteContent || err instanceof AccountNotFoundEror) {
      reply.status(400).send({
        message: err.message
      });
    }
  }
}