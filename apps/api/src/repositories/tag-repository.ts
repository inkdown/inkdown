import { Prisma, Tag } from "@prisma/client";

export interface TagRepository {

	create(data: Prisma.TagUncheckedCreateInput): Promise<void>;
	findByAuthor(authorId: string): Promise<Tag[]>;
	delete(id: number): Promise<void>;

}
