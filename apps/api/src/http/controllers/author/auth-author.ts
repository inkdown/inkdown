import type { AccessTokenPayload } from "@/types/fastify-jwt";
import { InvalidCredentialsError } from "@/use-cases/errors/invalid-credentials-error";
import { makeAuthAuthorUseCase } from "@/use-cases/factories/author/make-auth-author-use-case";
import type { FastifyReply, FastifyRequest } from "fastify";
import z from "zod";

export async function authAuthor(request: FastifyRequest, reply: FastifyReply){
  const authAuthorSchema = z.object({
    email: z.string().email(),
    password: z.string().min(1),
  });

  const { email, password } = authAuthorSchema.parse(request.body);

  try{
    const useCase = makeAuthAuthorUseCase();

    const author = await useCase.create({
      email,
      password
    });

    const token = await reply.jwtSign({
      sub: author.id,
    });

    return reply.status(200).send({
      token, author,
    });
  }catch(err){
    if(err instanceof InvalidCredentialsError){
      return reply.status(400).send({
        message: err.message,
      });
    }
  }
}