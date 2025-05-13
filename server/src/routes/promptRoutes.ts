import { Router } from "express";
import { ErrorDetails, ErrorType, NotFoundErrorDetails, ValidationErrorDetails } from "../library/error-types";
import { validateCreatePrompt } from "../models/Prompt";
import promptService from "../services/promptService";

const router = Router();

router.get("/:id", async (req, res) => {
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
      return res.status(404).json(new NotFoundErrorDetails("Prompt not found"));
    } else {
      return res.status(500).json(new ErrorDetails("Failed to get prompt", error.details));
    }
  }
});

router.get("/chain/:chainId", async (req, res) => {
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

  const [prompts, error] = await promptService.getPromptsByChainId(chainId);

  if (error) {
    return res.status(500).json(new ErrorDetails("Failed to get prompts", error.details));
  } else {
    return res.status(200).json(prompts);
  }
});

router.post("/", async (req, res) => {
  const { chainId, index, text, userId } = req.body;

  const validationResult = validateCreatePrompt(req.body);

  if (validationResult.length) {
    return res.status(400).json(new ValidationErrorDetails("Invalid prompt data", validationResult));
  } else {
    // continue with the rest of the function
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
    return res.status(500).json(new ErrorDetails("Failed to create prompt", error.details));
  }
});

export { router as promptRouter };

