import { Router } from "express";
import { ErrorDetails, ErrorType, ValidationErrorDetails } from "../library/error-types";
import { validateCreatePrompt } from "../models/Prompt";
import promptService from "../services/promptService";

const router = Router();

router.get("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);

    if (isNaN(id)) {
      return res.status(400).json(new ValidationErrorDetails(
        "Invalid prompt ID",
        [{
          field: "id",
          message: "Prompt ID must be a number",
          isValid: false,
        }]
      ));
    }

    const [prompt, error] = await promptService.getPromptById(id);

    if (prompt) {
      return res.status(200).json(prompt);
    } else {
      if (error.type === ErrorType.NotFound) {
        return res.status(404).json(error);
      } else {
        return res.status(500).json(error);
      }
    }
  } catch (error: any) {
    return res.status(500).json(new ErrorDetails("Failed to get prompt", [error.message], error.stack));
  }
});

router.get("/chain/:chainId", async (req, res) => {
  try {  const chainId = parseInt(req.params.chainId);

    if (isNaN(chainId)) {
      return res.status(400).json(new ValidationErrorDetails(
        "Invalid chain ID",
        [{
          field: "chainId",
          message: "Chain ID must be a number",
          isValid: false,
        }]
      ));
    }

    const [prompts, error] = await promptService.getPromptsByChainId(chainId);

    if (error) {
      return res.status(500).json(error);
    } else {
      return res.status(200).json(prompts);
    }
  } catch (error: any) {
    return res.status(500).json(new ErrorDetails("Failed to get prompts", [error.message], error.stack));
  }
});

router.post("/", async (req, res) => {
  try {
    const { chainId, index, text } = req.body;
    const userId = req.user?.id;

    const validationResult = validateCreatePrompt({
      chainId,
      index,
      text,
      userId,
    });

    if (validationResult.length) {
      return res.status(400).json(new ValidationErrorDetails("Invalid prompt data", validationResult));
    } else if (userId === undefined) {
      return res.status(401).json(new ErrorDetails("User not authenticated", ["User ID is undefined"]));
    }

    const [createdPrompt, error] = await promptService.createPrompt({
      chainId,
      index,
      text,
      userId,
    });

    if (createdPrompt) {
      return res.status(201).json(createdPrompt);
    } else {
      return res.status(500).json(error);
    }
  } catch (error: any) {
    return res.status(500).json(new ErrorDetails("Failed to create prompt", [error.message], error.stack));
  }
});

// Get the latest prompt by chain ID
router.get("/chain/:chainId/latest", async (req, res) => {
  try {  
    const chainId = parseInt(req.params.chainId);

    if (isNaN(chainId)) {
      return res.status(400).json(new ValidationErrorDetails(
        "Invalid chain ID",
        [{
          field: "chainId",
          message: "Chain ID must be a number",
          isValid: false,
        }]
      ));
    }

    const [prompts, error] = await promptService.getLatestPromptByChainId(chainId);

    if (error) {
      return res.status(500).json(error);
    } else {
      return res.status(200).json(prompts);
    }
  } catch (error: any) {
    return res.status(500).json(new ErrorDetails("Failed to get latest prompt", [error.message], error.stack));
  }
});

export { router as promptRouter };

