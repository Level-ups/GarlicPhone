import { UUID } from "crypto";

export type Game = {
  id: number;
  urlId: UUID;
  startedAt: Date;
}

export type GameDto = {
  urlId: UUID;
  startedAt: Date;
}

export type GameQueryResult = {
  game_id: number;
  url_id: UUID;
  started_at: Date;
}