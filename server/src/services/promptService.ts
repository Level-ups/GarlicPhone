import { Either } from "../../../lib/types";
import { ErrorDetails, InsertErrorDetails, NotFoundErrorDetails } from "../library/error-types";
import { Prompt, PromptDto } from "../models/Prompt";
import promptRepository from "../repositories/promptRepository";

export async function getPromptById(id: number): Promise<Either<Prompt, ErrorDetails>> {
  try {
    const prompt = await promptRepository.getPromptById(id);
    if (!prompt) {
      return [undefined, new NotFoundErrorDetails("Prompt not found")];
    } else {
      return [prompt, undefined];
    }
  } catch (error: any) {
    return [undefined, new ErrorDetails("Error retrieving prompt", [error.message], error.stack)];
  }
}

export async function getPromptsByChainId(chainId: number): Promise<Either<Prompt[], ErrorDetails>> {
  try {
    const prompts = await promptRepository.getPromptsByChainId(chainId);
    return [prompts, undefined];
  } catch (error: any) {
    return [undefined, new ErrorDetails("Error retrieving prompts", [error.message], error.stack)];
  }
}

export async function createPrompt(prompt: PromptDto): Promise<Either<Prompt, ErrorDetails>> {
  try {
    const createdPrompt = await promptRepository.insertPrompt(prompt);
    if (!createdPrompt) {
      return [undefined, new InsertErrorDetails("Could not create prompt")];
    } else {
      return [createdPrompt, undefined];
    }
  } catch (error: any) {
    return [undefined, new ErrorDetails("Error creating prompt", [error.message], error.stack)];
  }
}

async function getLatestPromptByChainId(chainId: number): Promise<Either<Prompt, ErrorDetails>> {
  try {
    const prompt = await promptRepository.getLatestPromptByChainId(chainId);
    if (!prompt) {
      return [undefined, new NotFoundErrorDetails("Prompt not found")];
    } else {
      return [prompt, undefined];
    }
  } catch (error: any) {
    return [undefined, new ErrorDetails("Error retrieving prompt", [error.message], error.stack)];
  }
}

export default {
  getPromptById,
  getPromptsByChainId,
  createPrompt,
  getLatestPromptByChainId,
};