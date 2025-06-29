import { sendMessageUsecase } from "@/use-cases/discord-notification/send-message";
import type { FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";

export async function sendMessage(req: FastifyRequest, reply: FastifyReply) {
  const sendMessageSchema = z.object({
    content: z.string(),
  });
  
  const { content } = sendMessageSchema.parse(req.body);

  sendMessageUsecase(content);

  return reply.send({
    message: "Enviado",
  });
}