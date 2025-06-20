export class AuthorAlredyExistError extends Error{
  constructor(){
    super("A user alredy exists with this email");
  }
}