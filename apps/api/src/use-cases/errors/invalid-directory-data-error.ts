export class InvalidDirectoryError extends Error {
  constructor(data: string) {
    super("Invalid data " + data);
  }
}