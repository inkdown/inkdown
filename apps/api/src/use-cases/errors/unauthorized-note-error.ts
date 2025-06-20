export class UnauthorizedNoteError extends Error{
  constructor(){
    super("This note is private and cannot be iteracted");
  }
}