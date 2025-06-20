export class NoteNotFoundError extends Error{
  constructor(){
    super("Note not found");
  }
}