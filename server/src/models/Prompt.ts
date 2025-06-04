import { ValidationResult } from "../library/types";
import { Chain, ChainQueryResult } from "./Chain";
import { User, UserQueryResult } from "./User";

export type Prompt = {
  id: number;
  chain: Chain;
  index: number;
  text: string;
  user: User;
  createdAt: Date;
}


export type PromptQueryResult = {
  prompt_id: number;
  chain_id: number;
  index: number;
  text: string;
  user_id: number;
  created_at: Date;
} & ChainQueryResult & UserQueryResult;


export type PromptDto = {
  chainId: number;
  index: number;
  text: string;
  userId: number;
}

export function validateCreatePrompt(prompt: Partial<PromptDto>): ValidationResult[] {
  const createPromptValidations: ValidationResult[] = [
    {
      field: "chainId",
      isValid:!!prompt.chainId,
      message: "Chain ID must be a positive integer",
    },
    {
      field: "index",
      isValid:!!prompt.index,
      message: "Index must be a positive integer",
    },
    {
      field: "text",
      isValid: !!prompt.text,
      message: "Text must be a non-empty string",
    }
  ];
  
  return createPromptValidations.filter(validation => !validation.isValid);
}
