import pool from "../library/db";
import { gameMapper } from "../library/mappers";
import { Game, GameDto } from "../models/Game";

async function getGames(): Promise<Game[]> {
  const query = `
    SELECT
      g.id AS game_id,
      g.started_at,
      g.url_id
    FROM games g
  `

  const result = await pool.query(query);
  return result.rows.map((row) => gameMapper.toDomain(row));
}

async function insertGame(game: GameDto): Promise<Game | null> {
  const query = `
      INSERT INTO games (url_id, started_at)
      VALUES ($1, $2)
      RETURNING id AS game_id, url_id, started_at
  `
  const result = await pool.query(query, [game.urlId, new Date()]);
  return result.rows.length ? gameMapper.toDomain(result.rows[0]) : null;
}

async function getGameById(id: number): Promise<Game | null> {
  const query = `
    SELECT
      g.id AS game_id,
      g.started_at,
      g.url_id
    FROM games g
    WHERE g.id = $1
  `

  const result = await pool.query(query, [id]);
  return result.rows.length ? gameMapper.toDomain(result.rows[0]) : null;
}

export default {
  getGames,
  insertGame,
  getGameById
};