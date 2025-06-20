import { NodeMailerMailRepository } from "@/repositories/nodemailer-mail-repository";
import type { PrismaAuthorRepository } from "@/repositories/prisma-author-repository";
import { AuthorAlredyExistError } from "../errors/author-alredy-exists-error";
import { generateKey, randomBytes } from "node:crypto";
import { GenerateCodeError } from "../errors/GenerateCodeError";
import { MailError } from "../errors/MailSendError";

interface SendAuthorCodeRequest {
  email: string,
};

export class SendAuthorUseCase{
  constructor(private repository: PrismaAuthorRepository, private mailRepository: NodeMailerMailRepository){};

  async send({
    email,
  }: SendAuthorCodeRequest){
    const authorAlredyExists = await this.repository.findByEmail(email);

    console.log(authorAlredyExists);

    if(authorAlredyExists){
      throw new AuthorAlredyExistError();
    }

    const code = randomBytes(4).toString("hex");

    console.log(code);

    try{
      await this.mailRepository.sendMail({
        from: "furquimmsw@gmail.com",
        to: email,
        subject: "Código de verificação de email",
        code,
      });

      return code;
    }catch(err){
      throw new MailError(err);
    } 
  }
}