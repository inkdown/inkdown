import fastify,{ type FastifyReply, type FastifyRequest } from "fastify";
import { appRoutes } from "./http/routes";
import { ZodError } from "zod";
import { env } from "@inkdown/env";
import cors from "@fastify/cors"
import fastifyJwt from "@fastify/jwt";
import fastifyCookie from "@fastify/cookie";
import { verifyJwt } from "./http/middlewares/verify-jwt";

export const app = fastify();

app.register(cors, {
  origin: env.CONSUMER_URL,
  methods: ['GET', 'POST', 'OPTIONS', 'PUT'],
  credentials: true,
});

app.register(fastifyJwt, {
  secret: env.JWT_SECRET,
  sign: {
    expiresIn: '120min',
  },
});

app.register(fastifyCookie, {
  secret: env.JWT_SECRET,
});


const publicRoutes = [
  '/authors/create',
  '/authors/code',
  '/authors/auth',
  '/authors/code/validate',
  '/auth/google',
  '/auth/google/callback',
  '/auth/github',
  '/auth/github/callback'
];


appRoutes(app);

app.addHook('preHandler', async (request: FastifyRequest, reply: FastifyReply) => {
  console.log(request.originalUrl);


  if (publicRoutes.includes(request.originalUrl ?? request.url)) {
    return;
  };

  verifyJwt(request, reply);
});

app.setErrorHandler((error, request, reply) => {
  if (error instanceof ZodError) {
    return reply
      .status(400)
      .send({ message: "Invalid data ", issues: error.flatten().fieldErrors });
  };

  if (env.NODE_ENV !== 'production') {
    console.error(error);
  } else {
    // TODO: Here we should log to a external tool like DataDog/NewRelic/Sentry
  }
  return reply.status(500).send({
    message: 'Internal server error.',
    cause: error.message,
    stack: error.stack,
  });
});
