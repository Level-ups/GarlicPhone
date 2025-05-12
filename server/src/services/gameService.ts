import { ErrorDetails, InsertErrorDetails, NotFoundErrorDetails } from "../library/error-types";
import { Either } from "../library/types";
import { Game, GameDto } from "../models/Game";
import gameRepository from "../repositories/gameRepository";

async function getAllGames(): Promise<Either<Game[], ErrorDetails>> {
  let games: Game[];
  try {
    games = await gameRepository.getGames();
  } catch (error: any) {
    return [undefined, new ErrorDetails("Error fetching games", [error.message])];
  }

  return [games, undefined]
}

async function getGameById(id: number): Promise<Either<Game, ErrorDetails>> {
  let game: Game | null;
  try {
    game = await gameRepository.getGameById(id);
  } catch (error: any) {
    return [undefined, new ErrorDetails("Error fetching games", [error.message])];
  }

  if (game) {
    return [game, undefined];
  } else {
    return [undefined, new NotFoundErrorDetails(`Game with id ${id} could not be found`)];
  }
}

async function createGame(game: GameDto): Promise<Either<Game, ErrorDetails>> {
  let createdGame: Game | null;
  try {
    createdGame = await gameRepository.insertGame(game);
  } catch (error: any) {
    return [undefined, new ErrorDetails("Error creating game")];
  }

  if (createdGame) {
    return [createdGame, undefined];
  } else {
    return [undefined, new InsertErrorDetails("Error creating game")];
  }
}

export default {
  getAllGames, 
  getGameById,
  createGame
}