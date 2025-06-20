import { DirectoryNotFoundError } from "@/use-cases/errors/directory-not-found-error";
import { UnnauthorizedDirectoryError } from "@/use-cases/errors/unnauthorized-directory-error";
import makeMoveDirectoryUseCase from "@/use-cases/factories/directory/make-move-directory-use-case";
import type { FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";

export default async function moveDirectory(
  req: FastifyRequest<{ Params: { directoryId: string, parentId: string } }>,
  reply: FastifyReply
) {

  const moveDirectorySchema = z.object({
    directoryId: z.string().transform(Number),
    parentId: z.string().transform(val => val === "null" ? null : Number(val)).nullable(),
  });

  const { parentId, directoryId } = moveDirectorySchema.parse(req.params);
  const authorId = req.user.sub;

  const useCase = makeMoveDirectoryUseCase();

  try {
    await useCase.move({
      directoryId,
      parentId,
      authorId
    });
  } catch (e) {
    if (e instanceof DirectoryNotFoundError) {
      return reply.status(404).send({
        message: e.message
      });
    };

    if (e instanceof UnnauthorizedDirectoryError) {
      return reply.status(401).send({
        message: e.message
      });
    };
  }

}