import { getHtmlTemplate, transporter } from "@/lib/nodemailer";
import type { MailRepository } from "./mail-repository";

export type SendMailProps = {
   from: string,
   to: string,
   subject: string,
   code: string,
}

export class NodeMailerMailRepository implements MailRepository{
  async sendMail({ from, to, subject, code }: SendMailProps): Promise<void> {
   try{
      await transporter.sendMail({from, to, subject, html: getHtmlTemplate(code) });
   }catch(err){
      throw err;
   }
  }
}