import { FastifyInstance } from "fastify";
import { createTag } from "./create-tag";

export async function tagRoute(instance: FastifyInstance) {
	instance.post("/create", createTag);
}
