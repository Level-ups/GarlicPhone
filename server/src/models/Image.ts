import { ValidationResult } from "../library/types";
import { Prompt, PromptQueryResult } from "./Prompt";
import { User, UserQueryResult } from "./User";

export type Image = {
  id: number;
  s3Url: string;
  prompt: Prompt;
  user: User;
}

export type ImageQueryResult = {
  image_id: number;
  s3_url: string;
  prompt_id: number;
  user_id: number;
} & PromptQueryResult & UserQueryResult;

export type ImageUploadDto = {
  promptId: number;
  userId: number;
  image: Buffer;
}

export type InsertImageDto = {
  s3Url: string;
  promptId: number;
  userId: number;
}

export function validateImageUploadDto(imageUploadDto: Partial<ImageUploadDto>): ValidationResult[] {
  const imageUploadValidations: ValidationResult[] = [
    {
      field: "promptId",
      message: "promptId is required",
      isValid: !imageUploadDto.promptId,
    },
    {
      field: "userId",
      message: "userId is required",
      isValid: !imageUploadDto.userId,
    },
    {
      field: "image",
      message: "image is required",
      isValid: !imageUploadDto.image,
    }
  ];

  return imageUploadValidations.filter((field) =>!field.isValid);
}
