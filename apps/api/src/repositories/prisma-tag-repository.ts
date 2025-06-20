import { prisma } from "@/lib/prisma";
import { TagRepository } from "./tag-repository";
import { Prisma } from "@prisma/client";

export class PrismaTagRepository implements TagRepository {
	async create(data: Prisma.TagUncheckedCreateInput): Promise<void> {
		await prisma.tag.create({
			data,
		});
	}

	async findByAuthor(authorId: string) {
		return await prisma.tag.findMany({
			where: {
				authorId,
			}
		})
	}

	async delete(id: number): Promise<void> {
		await prisma.tag.delete({
			where: {
				id,
			}
		})
	}

}
