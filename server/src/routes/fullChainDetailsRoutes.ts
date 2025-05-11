import { UUID } from "crypto";
import { Router } from "express";
import { ErrorDetails, ErrorType, ValidationErrorDetails } from "../library/error-types";
import fullChainDetailsService from "../services/fullChainDetailsService";

const router = Router();

// Get all chain details for a game
router.get("/game/:gameId", async (req, res) => {
  const { gameId } = req.params;

  if (!gameId) {
    return res.status(400).json(new ValidationErrorDetails(
      "gameId is required",
      [{
        field: "gameId",
        message: "gameId is required",
        isValid: false,
      }]
    ));
  }

  try {
    const [chainDetails, error] = await fullChainDetailsService.getFullChainDetailsByGameId(gameId as UUID);

    if (chainDetails) {
      return res.status(200).json(chainDetails);
    } else {
      if (error.type === ErrorType.NotFound) {
        return res.status(404).json(error);
      } else {
        return res.status(500).json(error);
      }
    }
  } catch (error: any) {
    return res.status(500).json(new ErrorDetails("An unexpected error occurred", [error.message]));
  }
});

// Get chain detail by chain ID
router.get("/chain/:chainId", async (req, res) => {
  const { chainId } = req.params;

  if (!chainId || isNaN(Number(chainId))) {
    return res.status(400).json(new ValidationErrorDetails(
      "Valid chainId is required",
      [{
        field: "chainId",
        message: "chainId must be a valid number",
        isValid: false,
      }]
    ));
  }

  try {
    const [chainDetail, error] = await fullChainDetailsService.getFullChainDetailByChainId(Number(chainId));

    if (chainDetail) {
      return res.status(200).json(chainDetail);
    } else {
      if (error.type === ErrorType.NotFound) {
        return res.status(404).json(error);
      } else {
        return res.status(500).json(error);
      }
    }
  } catch (error: any) {
    return res.status(500).json(new ErrorDetails("An unexpected error occurred", [error.message]));
  }
});

export const fullChainDetailsRouter = router;