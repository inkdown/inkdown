export class GenerateCodeError extends Error{
  constructor(message: string){
    super("Error during code generation. " + message);
  }
}