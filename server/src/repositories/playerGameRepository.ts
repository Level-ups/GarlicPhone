import pool from "../library/db";
import { playerGameMapper } from "../library/mappers";
import { PlayerGame, PlayerGameDto } from "../models/PlayerGames";

async function getPlayerGames(): Promise<PlayerGame[]> {
  const query = `
    SELECT
      pgs.id,
      g.id AS game_id,
      g.started_at,
      g.url_id,
      u.id AS user_id,
      u.google_sub,
      u.name,
      u.avatar_url,
      r.id AS role_id,
      r.name AS role_name
    FROM player_games pgs
      INNER JOIN games g ON g.id = pgs.game_id
      INNER JOIN users u ON u.id = pgs.user_id
      INNER JOIN roles r ON u.role_id = r.id
  `

  const result = await pool.query(query);
  return result.rows.map((row) => playerGameMapper.toDomain(row));
}

async function insertPlayerGame(playerGame: PlayerGameDto): Promise<PlayerGame | null> {
  const query = `
    WITH inserted_player_game AS (
      INSERT INTO player_games (user_id, game_id)
      VALUES ($1, $2)
      RETURNING id, user_id, game_id
    )
    SELECT
      pgs.id,
      g.id AS game_id,
      g.started_at,
      g.url_id,
      u.id AS user_id,
      u.google_sub,
      u.name,
      u.avatar_url,
      r.id AS role_id,
      r.name AS role_name
    FROM inserted_player_game pgs
      INNER JOIN games g ON g.id = pgs.game_id
      INNER JOIN users u ON u.id = pgs.user_id
      INNER JOIN roles r ON u.role_id = r.id
  `
  const result = await pool.query(query, [playerGame.userId, playerGame.gameId]);
  return result.rows.length ? playerGameMapper.toDomain(result.rows[0]) : null;
}

export default {
  getPlayerGames,
  insertPlayerGame,
};