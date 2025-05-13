import { UUID } from "crypto";
import { ErrorDetails, NotFoundErrorDetails } from "../library/error-types";
import { Either } from "../library/types";
import { FullChainDetail } from "../models/FullChainDetail";
import fullChainDetailsRepository from "../repositories/fullChainDetailsRepository";

export async function getFullChainDetailsByGameId(gameId: UUID): Promise<Either<FullChainDetail[], ErrorDetails>> {
  try {
    const chainDetails = await fullChainDetailsRepository.getFullChainDetailsByGameId(gameId);
    return [chainDetails, undefined];
  } catch (error: any) {
    return [undefined, new ErrorDetails("Error fetching chain details", [error.message])];
  }
}

export async function getFullChainDetailByChainId(chainId: number): Promise<Either<FullChainDetail, ErrorDetails>> {
  try {
    const chainDetail = await fullChainDetailsRepository.getFullChainDetailByChainId(chainId);
    if (!chainDetail) {
      return [undefined, new NotFoundErrorDetails("Chain not found")];
    } else {
      return [chainDetail, undefined];
    }
  } catch (error: any) {
    return [undefined, new ErrorDetails("Error fetching chain detail", [error.message])];
  }
}

export default {
  getFullChainDetailsByGameId,
  getFullChainDetailByChainId
};