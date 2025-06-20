export class UnauthorizedReactionError extends Error{
  constructor(){
    super("Cant react two times at the same note, only updates.");
  }
}