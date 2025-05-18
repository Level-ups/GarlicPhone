import { PoolClient } from "pg";
import pool from "../library/db";
import { chainMapper, playerGameMapper } from "../library/mappers";
import { Chain, ChainDto } from "../models/Chain";

async function getAllChains(): Promise<Chain[]> {
  const query = `
    SELECT
      c.id,
      g.id AS game_id,
      g.started_at,
      g.url_id,
    FROM chains c
      INNER JOIN games g ON g.id = pgs.game_id
  `

  const result = await pool.query(query);
  return result.rows.map((row) => chainMapper.toDomain(row))
}

async function getChainsByGameId(chainDto: ChainDto): Promise<Chain[]> {
  const query = `
    SELECT
      c.id,
      g.id AS game_id,
      g.started_at,
      g.url_id,
    FROM chains c
      INNER JOIN games g ON g.id = pgs.game_id
    WHERE g.id = $1
  `

  const result = await pool.query(query, [chainDto.gameId]);
  return result.rows.map((row) => chainMapper.toDomain(row))
}

async function insertChain(chainDto: ChainDto, client?: PoolClient): Promise<Chain | null> {
  const query = `
    WITH inserted_chain AS (
      INSERT INTO chains (game_id)
      VALUES ($1)
      RETURNING id, game_id
    )
    SELECT
      c.id,
      g.id AS game_id,
      g.started_at,
      g.url_id
    FROM inserted_chain c
      INNER JOIN games g ON g.id = c.game_id
  `
  const result = await (client ?? pool).query(query, [chainDto.gameId]);
  return result.rows.length ? playerGameMapper.toDomain(result.rows[0]) : null;
}

export default {
  getAllChains,
  insertChain,
  getChainsByGameId
};