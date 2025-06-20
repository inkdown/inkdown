export class InvalidDataError extends Error{
  constructor(data: string){
    super("Invalid data " + data);
  }
}