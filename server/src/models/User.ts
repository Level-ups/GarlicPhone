import { ValidationResult } from "../library/types";
import { Role } from "./Role";

export type UserQueryResult = {
  user_id: number;
  google_sub: string;
  name: string;
  avatar_url: string | null;
  role_id: number;
  role_name: string;
}

export type User = {
  id: number;
  googleSub: string;
  name: string;
  avatarUrl: string | null;
  role: Role;
};

export type UserDto = {
  googleSub: string;
  name: string;
  avatarUrl: string;
  roleName: string;
}

export function validateCreateUser(input: Partial<UserDto>): ValidationResult[] {
  const invalidFields: ValidationResult[] = [
    {
      field: "name",
      message: "'name' is required",
      isValid: !!input.name?.trim(),
    },
    {
      field: "googleSub",
      message: "'googleSub' is required",
      isValid: !!input.googleSub?.trim(),
    },
    {
      field: "roleName",
      message: "'roleName' is required",
      isValid:!!input.roleName?.trim(),
    }
  ].filter((field) => !field.isValid);
  return invalidFields;
}