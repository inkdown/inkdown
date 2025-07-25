import type { Author, Prisma } from "@prisma/client";

export interface AuthorsRepository {
  create(data: Prisma.AuthorCreateInput): Promise<Author>; 
  findByEmail(email: string): Promise<Author | null>;
  getUserData(authorId: string): Promise<Prisma.AuthorGetPayload<{ include: { settings: true } }> | null>
  findById(id: string): Promise<Author | null>;
}