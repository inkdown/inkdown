export class AccountNotFoundEror extends Error{
  constructor(credentials: string[]){
    super("There is no account related with this credentials " + credentials.toString());
  }
}