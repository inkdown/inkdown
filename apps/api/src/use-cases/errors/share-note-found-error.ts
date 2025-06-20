export class ShareNotFoundError extends Error{
  constructor(){
    super("Share not found");
  }
}