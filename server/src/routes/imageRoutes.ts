import { Router } from "express";
import { ErrorDetails, ErrorType, NotFoundErrorDetails, ValidationErrorDetails } from "../library/error-types";
import imageService from "../services/imageService";

const router = Router();

router.get("/:id", async (req, res) => {
  const id = parseInt(req.params.id);

  if (isNaN(id)) {
    return res.status(400).json(new ValidationErrorDetails(
      "Invalid image ID",
      [{
        field: "id",
        message: "Image ID must be a number",
        isValid: false,
      }]
    ));
  }

  try {
    const [image, error] = await imageService.getImageById(id);
  
    if (image) {
      return res.status(200).json(image);
    } else {
      if (error.type === ErrorType.NotFound) {
        return res.status(404).json(new NotFoundErrorDetails("Image not found", error.details));
      } else {
        return res.status(500).json(new ErrorDetails("Error fetching image", error.details));
      }
    }
  } catch (error: any) {
    return res.status(500).json(new ErrorDetails("An unexpected error occurred", [error.message], error.stack));
  }
});

router.get("/prompt/:promptId", async (req, res) => {
  const promptId = parseInt(req.params.promptId);

  if (isNaN(promptId)) {
    return res.status(400).json(new ValidationErrorDetails(
      "Invalid prompt ID",
      [{
        field: "promptId",
        message: "Prompt ID must be a number",
        isValid: false,
      }]
    ));
  }

  try {
    const [images, error] = await imageService.getImagesByPromptId(promptId);
  
    if (error) {
      return res.status(500).json(new ErrorDetails("Error fetching images", error.details));
    } else {
      return res.status(200).json(images);
    }
  } catch (error: any) {
    return res.status(500).json(new ErrorDetails("An unexpected error occurred", [error.message], error.stack));
  }
});

export { router as imageRouter };

