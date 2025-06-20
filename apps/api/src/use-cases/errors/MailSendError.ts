export class MailError extends Error{
  constructor(err: unknown){
    super("Error during mail sending " + err);
  }
}