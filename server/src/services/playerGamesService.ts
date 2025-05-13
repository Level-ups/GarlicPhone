import { ErrorDetails, InsertErrorDetails } from "../library/error-types";
import { Either } from "../library/types";
import { PlayerGame, PlayerGameDto } from "../models/PlayerGames";
import playerGameRepository from "../repositories/playerGameRepository";

export async function getAllPlayerGames(): Promise<Either<PlayerGame[], ErrorDetails>> {
  let playerGames: PlayerGame[];
  try {
    playerGames = await playerGameRepository.getPlayerGames();
  } catch (error: any) {
    return [undefined, new ErrorDetails("Error fetching player-games", [error.message], error.stack)];
  }
  return [playerGames, undefined];
}

export async function addPlayerGame(playerGame: PlayerGameDto): Promise<Either<PlayerGame, ErrorDetails>> {
  let insertedPlayerGame: PlayerGame | null;
  try {
    insertedPlayerGame = await playerGameRepository.insertPlayerGame(playerGame);
  } catch (error: any) {
    return [undefined, new ErrorDetails("Error adding player game", [error.message], )];
  }

  if (insertedPlayerGame) {
    return [insertedPlayerGame, undefined];
  } else {
    return [undefined, new InsertErrorDetails("Error adding player game")]
  }
}

export default {
  getAllPlayerGames,
  addPlayerGame
}