import type { PrismaNoteRepository } from "@/repositories/prisma-note-repository";

interface GetAuthorWithoutDirNotesRequest{
  authorId: string,
};

export class GetAuthorWithoutDirNotes {
  constructor(private repo: PrismaNoteRepository) {};

  async get({
    authorId
  }: GetAuthorWithoutDirNotesRequest) {
    const notes = await this.repo.findAuthorsWithoutDir(authorId);

    return notes;
  }
}