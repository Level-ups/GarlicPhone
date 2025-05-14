import { ValidationResult } from "../library/types";
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

export function validatePlayerGameDto(dto: PlayerGameDto): ValidationResult[]  {
  const gameDtoValidations: ValidationResult[] = [
    {
      isValid: dto.userId > 0,
      message: "userId must be a positive integer",
      field: "userId"
    },
    {
      isValid: dto.gameId > 0,
      message: "gameId must be a positive integer",
      field: "gameId"
    }
  ];

  return gameDtoValidations.filter(v => !v.isValid);
}