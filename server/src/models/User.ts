import { ValidationResult } from "../library/types";

export type User = {
  id: string;
  googleSub: string;
  name: string;
  avatarUrl: string;
  roleName: string;
};

export function validateCreateOrUpdateUser(input: any): ValidationResult[] {
  const invalidFields: ValidationResult[] = [
    {
      field: "name",
      message: "'name' is required",
      isValid: !!input.name.trim(),
    },
    {
      field: "googleSub",
      message: "'googleSub' is required",
      isValid: !!input.googleSub.trim(),
    },
    {
      field: "roleName",
      message: "'roleName' is required",
      isValid:!!input.roleName.trim(),
    }
  ].filter((field) => !field.isValid);
  return invalidFields;
}