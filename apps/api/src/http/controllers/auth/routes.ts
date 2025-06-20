import type { FastifyInstance } from "fastify";
import { google } from "./google";
import { googleCallBack } from "./google-callback";
import { github } from "./github";
import { githubCallback } from "./github-callback";

export async function authRoutes(instance: FastifyInstance) {
  instance.get("/google", google);
  instance.get("/google/callback", googleCallBack);
  instance.get("/github", github);
  instance.get("/github/callback", githubCallback);
}