import { AuthorAlredyExistError } from "@/use-cases/errors/author-alredy-exists-error";
import { makeCreateAuthorUseCase } from "@/use-cases/factories/author/make-create-author-use-case";
import type { FastifyReply, FastifyRequest } from "fastify";
import z from "zod";

export async function createAuthor(request: FastifyRequest, reply: FastifyReply){{
  console.log(request.body);
  
  const createAuthorSchema = z.object({
    alias: z.string().min(1),
    email: z.string().email(),
    accountType: z.enum(["GITHUB", "DEFAULT", "GOOGLE"]).default("DEFAULT"),
    imageUrl: z.string().min(1),
    password: z.string().min(1),
  });

  const { alias,email,imageUrl, password, accountType } = createAuthorSchema.parse(request.body);

  const useCase = makeCreateAuthorUseCase();

  try{
    const author = await useCase.create({
      alias,
      email,
      password,
      accountType,
      imageUrl,
    });
  
    const token = await reply.jwtSign({
      sub: author.id,
    });
  
    return reply.status(201).send({
      author, token,
    });
  }catch(err){
    if(err instanceof AuthorAlredyExistError){
      reply.status(400).send({
        message: err.message,
      });
    };

    reply.status(500).send({
      err,
    }); 
  }
}}