import { Game, GameQueryResult } from "./Game";

export type Chain = {
  id: number;
  game: Game;
}

export type ChainQueryResult = {
  chain_id: number;
} & GameQueryResult;

export type ChainDto = {
  gameId: number;
}