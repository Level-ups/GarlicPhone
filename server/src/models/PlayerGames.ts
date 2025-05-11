import { Game, GameQueryResult } from "./Game";
import { User, UserQueryResult } from "./User";

export type PlayerGame = {
  id: number;
  user: User;
  game: Game;
}

export type PlayerGameQueryResult = {
  id: number;
} & UserQueryResult & GameQueryResult;

export type PlayerGameDto = {
  userId: number;
  gameId: number;
}