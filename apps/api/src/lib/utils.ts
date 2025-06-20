import type { VerificationTokenPayload } from "@/types/fastify-jwt";
import type { FastifyInstance } from "fastify";

export function decodeVerificationToken(token: string, fastify: FastifyInstance) {
  try {
    const payload = fastify.jwt.verify<VerificationTokenPayload>(token);
    return payload;
  } catch (err) {
    return null;
  }
}
