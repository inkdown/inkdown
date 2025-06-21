import axios from "axios";
import type { FastifyReply, FastifyRequest } from "fastify";
import { env } from "@inkdown/env";
import { makeCreateAuthorUseCase } from "@/use-cases/factories/author/make-create-author-use-case";

export async function githubCallback(req: FastifyRequest, reply: FastifyReply) {
  const code = (req.query as any).code;
  const redirectUri = `${env.API_URL}/auth/github/callback`;

  const tokenResponse = await axios.post(
    'https://github.com/login/oauth/access_token',
    {
      client_id: process.env.GITHUB_CLIENT_ID!,
      client_secret: process.env.GITHUB_CLIENT_SECRET!,
      code,
      redirect_uri: redirectUri,
    },
    {
      headers: {
        Accept: 'application/json',
      },
    }
  );

  const access_token = tokenResponse.data.access_token;

  const userResponse = await axios.get('https://api.github.com/user', {
    headers: {
      Authorization: `Bearer ${access_token}`,
    },
  });

  const emailsResponse = await axios.get('https://api.github.com/user/emails', {
    headers: {
      Authorization: `Bearer ${access_token}`,
    },
  });

  const primaryEmail = emailsResponse.data.find((email: any) => email.primary)?.email;

  const { id, name, login, avatar_url } = userResponse.data;


  const token = await reply.jwtSign({
    sub: String(id),
    email: primaryEmail,
    name: name || login,
    picture: avatar_url,
  });

  const useCase = makeCreateAuthorUseCase();

  await useCase.create({
    accountType: "GITHUB",
    alias: name,
    email: primaryEmail,
    imageUrl: avatar_url,
    password: String(id)
  });

  return reply.redirect(`${env.CONSUMER_URL}/auth-callback?token=${token}`);
}