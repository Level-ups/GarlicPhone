export type ValidationResult = {
  field: string;
  message: string;
  isValid: boolean;
}

export type Either<A, B> = [A, undefined?] | [undefined, B];