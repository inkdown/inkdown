export class UnauthorizedShareDeletionError extends Error{
  constructor(){
    super("You cant delete a share that isnt yours");
  }
}