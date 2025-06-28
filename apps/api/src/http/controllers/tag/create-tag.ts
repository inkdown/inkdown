import { makeCreateTagUsecase } from "@/use-cases/factories/tag/make-create-tag-use-case";
import { FastifyReply } from "fastify/types/reply";
import { FastifyRequest } from "fastify/types/request";
import { z } from "zod";

export async function createTag(req: FastifyRequest, reply: FastifyReply) {

	const createTagSchema = z.object({
		name: z.string(),
		color: z.string(),
	})

	const { name, color } = createTagSchema.parse(req.body);

	const authorId = req.user.sub;

	try {
		const useCase = makeCreateTagUsecase();

		return await useCase.create({ name, color, authorId });
	} catch(err) {
		
	}

} 
