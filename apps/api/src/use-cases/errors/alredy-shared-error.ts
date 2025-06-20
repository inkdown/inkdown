export class AlredySharedError extends Error{
  constructor(){
    super("Cant share the same note twice");
  }
}