import { DirectoryNotFoundError } from "@/use-cases/errors/directory-not-found-error";
import { UnnauthorizedDirectoryError } from "@/use-cases/errors/unnauthorized-directory-error";
import { makeDeleteDirectoryUseCase } from "@/use-cases/factories/directory/make-delete-directory-use-case";
import type { FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";

export default async function deleteDirectoryController(req: FastifyRequest, reply: FastifyReply){

  const deleteDirSchema = z.object({
    directoryId: z.string(),
  });

  const { directoryId } = deleteDirSchema.parse(req.params);

  const authorId = req.user.sub;

  const useCase = makeDeleteDirectoryUseCase();

  try {
    await useCase.delete({  
      dirId: Number(directoryId),
      authorId,
    });

    return reply.status(204).send();
  } catch(e) {
    if(e instanceof DirectoryNotFoundError){
      return reply.status(404).send({
        message: e.message
      });
    };

    if(e instanceof UnnauthorizedDirectoryError){
      return reply.status(401).send({
        message: e.message
      });
    };
  };

}