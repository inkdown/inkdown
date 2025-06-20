import type { FastifyInstance } from "fastify";
import { authorRoutes } from "./controllers/author/routes";
import { notesRoutes } from "./controllers/note/routes";
import { reactionRotes } from "./controllers/reaction/routes";
import { shareRoutes } from "./controllers/share/routes";
import { directoryRoutes } from "./controllers/directory/routes";
import { authRoutes } from "./controllers/auth/routes";

export async function appRoutes(instance: FastifyInstance){
  instance.register(authorRoutes, { prefix: "/authors" });
  instance.register(notesRoutes, { prefix: "/notes" });
  instance.register(reactionRotes, { prefix: "/reactions" });
  instance.register(shareRoutes, { prefix: "/shares" });
  instance.register(directoryRoutes, { prefix: "/directories" });
  // instance.register(authRoutes, { prefix: "/api/auth" });
  instance.register(authRoutes, { prefix: "/auth" });
}