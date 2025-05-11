import { ValidationResult } from "./types";

export enum ErrorType {
  NotFound = 'NotFound',
  Validation = 'Validation',
  ServerError = 'InternalServerError',
  InsertionError = 'InsertionError',
  UpdatedError = 'UpdatedError',
}

export class ErrorDetails extends Error {
  type: ErrorType;
  details: string[];
  message: string;
  constructor(message: string, details: string[] = [], type: ErrorType = ErrorType.ServerError) {
    super(message);
    this.message = message;
    this.type = type;
    this.details = details;
  }
}

export class ValidationErrorDetails extends ErrorDetails {
  constructor(message: string, details: ValidationResult[] = []) {
    const errorDetails = details.map(d => `${d.field}: ${d.message}`);
    super(message, errorDetails, ErrorType.Validation);
  }
}

export class NotFoundErrorDetails extends ErrorDetails {
  constructor(message: string, details: string[] = []) {
    super(message, details, ErrorType.NotFound);
  }
}

export class InsertErrorDetails extends ErrorDetails {
  constructor(message: string, details: string[] = []) {
    super(message, details, ErrorType.InsertionError);
  }
}

export class UpdatedErrorDetails extends ErrorDetails {
  constructor(message: string, details: string[] = []) {
    super(message, details, ErrorType.UpdatedError);
  }
}