import { AccountNotFoundEror } from "@/use-cases/errors/account-not-found-error";
import { makeGetNotesAuthor } from "@/use-cases/factories/note/make-get-notes-user";
import type { FastifyReply, FastifyRequest } from "fastify";

export async function getAuthorNotes(request: FastifyRequest, reply: FastifyReply){
  try{
    const useCase = makeGetNotesAuthor();
  
    const notes = await useCase.get({
      userId: request.user.sub, 
    });

    return reply.status(200).send({
      notes,
    });
  }catch(err){
    if(err instanceof AccountNotFoundEror){
      return reply.status(400).send({
        message: err.message
      });
    }
  }
}