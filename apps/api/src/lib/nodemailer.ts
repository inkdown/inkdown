import nodemailer from "nodemailer";
import path from "path";
import * as fs from "fs";

export const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: "furquimmsw@gmail.com",
    pass: "dhsv bmpt fbed kbpu",
  },
});


export const getHtmlTemplate = (code: string): string => {
  const templatePath = path.join(__dirname, ".." ,'static', 'confirmationEmail.html');
  let html = fs.readFileSync(templatePath, 'utf-8');
  html = html.replace('{{code}}', code);
  return html;
};