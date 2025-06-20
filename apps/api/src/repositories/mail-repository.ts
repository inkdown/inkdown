import type { SendMailProps } from "./nodemailer-mail-repository";

export interface MailRepository{
sendMail({ from, to, subject, code }: SendMailProps): Promise<void>;
}