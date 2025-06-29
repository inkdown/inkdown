import type { FastifyInstance } from "fastify";
import { sendMessage } from "./send-message";

export async function notificationRoute(instance: FastifyInstance) {
  instance.post("/send-message", sendMessage);
};