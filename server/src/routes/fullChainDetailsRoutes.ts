import { UUID } from "crypto";
import { Router } from "express";
import { ErrorDetails, ErrorType, ValidationErrorDetails } from "../library/error-types";
import fullChainDetailsService from "../services/fullChainDetailsService";
import { FullChainDetail } from "../models/FullChainDetail";

const router = Router();

export type ChainPrompt = { type: "prompt", prompt: string };
export type ChainImage = { type: "image", url: string };
export type ChainLink = ChainPrompt | ChainImage;
export type ChainInfo = {
    name: string,
    links: ChainLink[]
};

export function mapFullChainDetailsToChainInfoArray(
  fullChainDetails: FullChainDetail[]
): ChainInfo[] {
  return fullChainDetails.map(detail => {
      const links: ChainLink[] = [];

      detail.prompts.forEach(p => {
        if (p.image) {
          links.push({ type: "image", url: p.image.s3Url } as ChainImage);
        } else {
          links.push({ type: "prompt", prompt: p.prompt.text } as ChainPrompt);
        }
      });

      // Use the first prompt's text as the name for ChainInfo
      // Default to an empty string if there are no prompts or the first prompt has no text
      const chainName = detail.prompts.length > 0 && detail.prompts[0].prompt 
                          ? detail.prompts[0].prompt.text 
                          : "";

      return {
          name: chainName, // Updated to use the first prompt's text
          links: links
      };
  });
}


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
      
      const chainInfo: ChainInfo[] = mapFullChainDetailsToChainInfoArray(chainDetails);
      return res.status(200).json(chainInfo);
    } else {
      if (error.type === ErrorType.NotFound) {
        return res.status(404).json(error);
      } else {
        return res.status(500).json(error);
      }
    }
  } catch (error: any) {
    return res.status(500).json(new ErrorDetails("An unexpected error occurred", [error.message], error.stack));
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