import { InvalidDirectoryError } from "@/use-cases/errors/invalid-directory-data-error";
import { makeCreateDirectory } from "@/use-cases/factories/directory/make-create-directory-use-case";
import type { FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";

export async function creeateDirectory(request: FastifyRequest, reply: FastifyReply) {
  const creeateDirectorySchema = z.object({
    title: z.string().min(1),
    parentId: z.number().int().nullable()
  });

  const { title, parentId } = creeateDirectorySchema.parse(request.body);
  const authorId = request.user.sub;
  console.log(authorId);

  const useCase = makeCreateDirectory();

  try {
     const data = await useCase.create({
      title,
      authorId,
      parentId
    });
    console.log(data);
    return data;

  } catch(err) {
    if(err instanceof InvalidDirectoryError) {
      return reply.status(400).send({
        message: err.message
      });
    }
  }

  return reply.status(201).send();
}