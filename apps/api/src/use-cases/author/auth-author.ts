import type { AuthorsRepository } from "@/repositories/author-repository";
import bcrypt from "bcryptjs";
import { InvalidCredentialsError } from "../errors/invalid-credentials-error";

interface AuthAuthorRequest {
  email: string,
  password: string,
}

export class AuthAuthorUseCase{
  constructor(private repository: AuthorsRepository){}

  async create({
    email, password
  }: AuthAuthorRequest){

    const author = await this.repository.findByEmail(email);  
  
    if(!author){
      throw new InvalidCredentialsError();
    }

    const validAuth = bcrypt.compare(password, author.password);

    if(!validAuth){
      throw new InvalidCredentialsError();    
    }

    return author;
  }
}