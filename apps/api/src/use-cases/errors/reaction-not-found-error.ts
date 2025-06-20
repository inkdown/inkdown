export class ReactionNotFoundError extends Error{
  constructor(){
    super("Reaction not found");
  }
}