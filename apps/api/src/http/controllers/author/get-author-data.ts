import { makeGetAuthorDataUsecase } from "@/use-cases/factories/author/make-get-author-data-use-case";
import type { FastifyReply, FastifyRequest } from "fastify";

export async function getAuthorData(req: FastifyRequest, reply: FastifyReply) {

  try {
    const authorId = req.user.sub;

    const useCase = makeGetAuthorDataUsecase();

    return await useCase.get({
      authorId
    });

  } catch(err) {
    return reply.status(500).send({
      message: err,
    });
  }

}