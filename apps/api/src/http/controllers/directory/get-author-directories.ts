import makeGetAuthorDirectoriesUseCase from "@/use-cases/factories/directory/make-get-author-directories-use-case";
import { makeGetAuthorWithoutDirNotes } from "@/use-cases/factories/note/make-get-author-without-dir-notes";
import type { FastifyReply, FastifyRequest } from "fastify";

export default async function getAuthorDirectories(req: FastifyRequest, reply: FastifyReply) {
  const authorId = req.user.sub;

  const directorieUseCase = makeGetAuthorDirectoriesUseCase();
  const notesUseCase = makeGetAuthorWithoutDirNotes();

  try {
    const directories = await directorieUseCase.get({
      authorId,
    });

    const notes = await notesUseCase.get({authorId});

    if(directories.length === 0) {
      return reply.status(204).send();
    }

    return reply.status(200).send({
      directories,
      notes,
    });

  } catch (e) {
    console.log(e);

    return reply.status(500).send({
      message: "Error while getting the directories: " + e
    });
  }
}