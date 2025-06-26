import type { Author, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { AuthorsRepository } from "./author-repository";


export class PrismaAuthorRepository implements AuthorsRepository {
  findById(id: string): Promise<Author | null> {
    const author = prisma.author.findUnique({
      where: {
        id,
      },
    });
    return author;
  }
  async create(data: Prisma.AuthorCreateInput) {
    const author = await prisma.author.create({
      data: {
        id: data.id,
        email: data.email,
        password: data.password,
        alias: data.alias,
        accountType: data.accountType,
        imageUrl: data.imageUrl,
        status: data.status,
        settings: {
          create: {
            autocompletion: false,
            bracketMathing: false,
            hightlightActiveLine: false,
            hightlightSelectionMatches: false,
            lineNumbers: false,
            markdownLineStyler: false,
            syntaxHighlighting: false,
            theme: "light",
            vimMode: false,
          }
        }
      }
    });

    return author;
  }

  async findByEmail(email: string): Promise<Author | null> {
    const author = await prisma.author.findUnique({
      where: {
        email,
      }
    });
    return author;
  }

}