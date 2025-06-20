import { NodeMailerMailRepository } from "@/repositories/nodemailer-mail-repository";
import { PrismaAuthorRepository } from "@/repositories/prisma-author-repository";
import { SendAuthorUseCase } from "@/use-cases/author/send-author-use-case";

export function makeSendAuthorCodeUseCase(){
  const authRepo = new PrismaAuthorRepository();
  const mailRepo = new NodeMailerMailRepository();

  return new SendAuthorUseCase(authRepo, mailRepo);
}