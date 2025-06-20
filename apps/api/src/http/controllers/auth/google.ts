import type { FastifyReply, FastifyRequest } from "fastify";
import { env } from "@inkdown/env";

export async function google(req: FastifyRequest, reply: FastifyReply) {
  const redirectUri = `${env.API_URL}/auth/google/callback`;

  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID!,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'openid profile email',
    access_type: 'offline',
    prompt: 'consent',
  });

  return reply.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`);
}