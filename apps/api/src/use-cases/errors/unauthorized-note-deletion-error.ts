export class UnauthorizedNoteDeletionError extends Error{
  constructor(){
    super("You cant delete a note that isnt yours");
  }
}