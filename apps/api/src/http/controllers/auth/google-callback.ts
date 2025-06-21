import type { FastifyReply, FastifyRequest } from "fastify";
import { env } from "@inkdown/env";
import axios from "axios";
import { makeCreateAuthorUseCase } from "@/use-cases/factories/author/make-create-author-use-case";

export async function googleCallBack(req: FastifyRequest, reply: FastifyReply) {
  const code = (req.query as any).code;
  const redirectUri = `${env.API_URL}/auth/google/callback`;

  const tokenResponse = await axios.post('https://oauth2.googleapis.com/token', {
    code,
    client_id: process.env.GOOGLE_CLIENT_ID!,
    client_secret: process.env.GOOGLE_CLIENT_SECRET!,
    redirect_uri: redirectUri,
    grant_type: 'authorization_code',
  });

  const { access_token, id_token } = tokenResponse.data;

  const userInfo = await axios.get('https://www.googleapis.com/oauth2/v3/userinfo', {
    headers: {
      Authorization: `Bearer ${access_token}`,
    },
  });

  const { sub, email, name, picture } = userInfo.data;

  const useCase = makeCreateAuthorUseCase();

  const token = await reply.jwtSign({
    sub: sub,
    email: email,
    name: name,
    picture: picture,
  });


  await useCase.create({
    id: sub,
    accountType: "GOOGLE",
    alias: name,
    email,
    imageUrl: picture,
    password: sub
  });


  reply.setCookie("token", token, {
    httpOnly: true,
    // secure: true,
    maxAge: 60 * 60 * 24 * 7 // 7d
  });

  return reply.status(200).send({
    message: "success",
  });
}