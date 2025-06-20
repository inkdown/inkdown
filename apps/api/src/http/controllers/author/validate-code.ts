import { JwtDecondingError } from "@/use-cases/errors/JwtDecondingError";
import { makeVerifyCodeUseCase } from "@/use-cases/factories/author/make-verify-code-use-case";
import type { FastifyReply, FastifyRequest } from "fastify";
import z from "zod";

export async function validateCode(request: FastifyRequest, reply: FastifyReply){
  const validateCodeSchema = z.object({
    token: z.string(),
    code: z.string(),
  });

  const { token, code } = validateCodeSchema.parse(request.body);

  try{
    const useCase = makeVerifyCodeUseCase();

    const valid = await useCase.verify({
      token,
      code,
    });

    if(valid){
      reply.status(200).send({
        message: "Código validado com sucesso"
      });
    };

    reply.status(401).send({
      message: "Invalid code",
    });

  }catch(err){
    if(err instanceof JwtDecondingError){
      reply.status(500).send({
        message: err.message,
      });
    }
    reply.status(500).send({
      err,
    });
  }
}