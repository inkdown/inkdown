export class InvalidPublicNoteContent extends Error{
  constructor(){
    super("Cannot create a public note empty");
  }
}