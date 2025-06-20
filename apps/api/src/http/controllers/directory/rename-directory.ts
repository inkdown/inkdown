import { DirectoryNotFoundError } from "@/use-cases/errors/directory-not-found-error";
import { UnnauthorizedDirectoryError } from "@/use-cases/errors/unnauthorized-directory-error";
import makeRenameDirectory from "@/use-cases/factories/directory/make-rename-directory-use-case";
import type { FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";

export default async function renameDirectory(
  req: FastifyRequest, 
  reply: FastifyReply
) {
  const renameDirectorySchema = z.object({
    directoryId: z.number().int(),
    newTitle: z.string().min(0),
  });

  const { directoryId, newTitle } = renameDirectorySchema.parse(req.body);

  const authorId = req.user.sub;

  const useCase = makeRenameDirectory();

  try {
    await useCase.rename({
      dirId: directoryId,
      newTitle,
      authorId: authorId
    });

    return reply.status(204).send();
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