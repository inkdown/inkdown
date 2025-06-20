export class JwtDecondingError extends Error{
  constructor(){
    super("Verification code expired or invalid");
  }
}