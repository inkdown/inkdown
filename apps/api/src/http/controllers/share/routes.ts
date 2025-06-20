import type { FastifyInstance } from "fastify";
import { createShare } from "./create-share";
import { deleteShare } from "./delete-share";

export async function shareRoutes(instance: FastifyInstance) {
	instance.post("/create", createShare);
	instance.delete("/delete", deleteShare);
}
