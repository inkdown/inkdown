import type { AuthorsRepository } from "@/repositories/author-repository";
import bcrypt from "bcryptjs";

interface CreateAuthorUseCaseRequest {
  alias: string,
  email: string,
  password: string,
  accountType: string,
  imageUrl: string,
}

export class CreateAuthorUseCase{
  constructor(private repository: AuthorsRepository){}

  async create({
    alias, email, password, accountType, imageUrl
  }: CreateAuthorUseCaseRequest){
    const userAlredyExists =  await this.repository.findByEmail(email);

    if(userAlredyExists){
      return;
    };
    
    const hashedPassword = await bcrypt.hash(password, 6);
  
    const author = await this.repository.create({
      email,
      password: hashedPassword,
      alias,
      accountType,
      imageUrl,
      status: "pending"
    });
    return author;
  }

}