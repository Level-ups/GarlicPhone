export class ErrorResponse {
  message: string;
  details: string[] | undefined;

  constructor(message: string, details?: string[]) {
    this.message = message;
    this.details = details;
  }
}
