import type { FastifyReply, FastifyRequest } from "fastify";
import { env } from "@inkdown/env";

export async function github(req: FastifyRequest, reply: FastifyReply) {
  const redirectUri = `${env.API_URL}/auth/github/callback`;

  const params = new URLSearchParams({
    client_id: process.env.GITHUB_CLIENT_ID!,
    redirect_uri: redirectUri,
    scope: 'read:user user:email',
  });

  return reply.redirect(`https://github.com/login/oauth/authorize?${params.toString()}`);
};