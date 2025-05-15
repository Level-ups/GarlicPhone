import { ValidationResult } from "./types";

export enum ErrorType {
  NotFound = 'NotFoundError',
  Validation = 'ValidationError',
  ServerError = 'InternalServerError',
  InsertionError = 'InsertionError',
  UpdatedError = 'UpdatedError',
  ServerSentEventError = 'ServerSentEventError',
  UnauthorizedError = 'UnauthorizedError',
}

export class ErrorDetails extends Error {
  type: ErrorType;
  details: string[];
  message: string;
  stack?: string | undefined;

  constructor(message: string, details: string[] = [], stack?: string, type: ErrorType = ErrorType.ServerError) {
    super(message);
    this.message = message;
    this.type = type;
    this.details = details;
    this.stack = stack || this.stack;
  }
}

export class ValidationErrorDetails extends ErrorDetails {
  constructor(message: string, details: ValidationResult[] = [], stack?: string) {
    const errorDetails = details.map(d => `field={${d.field}}: ${d.message}`);
    super(message, errorDetails, stack, ErrorType.Validation);
  }
}

export class NotFoundErrorDetails extends ErrorDetails {
  constructor(message: string, details: string[] = [], stack?: string) {
    super(message, details, stack, ErrorType.NotFound);
  }
}

export class InsertErrorDetails extends ErrorDetails {
  constructor(message: string, details: string[] = [], stack?: string) {
    super(message, details, stack, ErrorType.InsertionError);
  }
}

export class UpdatedErrorDetails extends ErrorDetails {
  constructor(message: string, details: string[] = [], stack?: string) {
    super(message, details, stack, ErrorType.UpdatedError);
  }
}

export class ServerSentEventErrorDetails extends ErrorDetails {
  constructor(message: string, details: string[] = [], stack?: string) {
    super(message, details, stack, ErrorType.ServerSentEventError);
  }
}

export class UnauthorizedErrorDetails extends ErrorDetails {
  constructor(message: string, details: string[] = [], stack?: string) {
    super(message, details, stack, ErrorType.UnauthorizedError);
  }
}