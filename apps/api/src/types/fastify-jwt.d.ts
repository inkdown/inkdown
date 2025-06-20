import '@fastify/jwt';

export interface AccessTokenPayload {
  sub: string;
}

export interface VerificationTokenPayload {
  code: string;
}
declare module '@fastify/jwt' {
  export interface FastifyJWT {
    jwt: JWT;
    user: {
      sub: string;
    };
  }
}