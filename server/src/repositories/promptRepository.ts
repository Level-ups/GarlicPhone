import pool from '../library/db';
import { promptMapper } from '../library/mappers';
import { Prompt, PromptDto } from '../models/Prompt';

async function getPromptById(id: number): Promise<Prompt | null> {
  const query = `
    SELECT
      p.id AS prompt_id,
      p.chain_id,
      p.index,
      p.text,
      p.user_id,
      p.created_at,
      u.google_sub,
      u.name,
      u.avatar_url,
      u.role_id,
      r.name as role_name,
      g.id AS game_id,
      g.started_at,
      g.url_id,
      c.id AS chain_id
    FROM prompts p
    INNER JOIN users u ON p.user_id = u.id
    INNER JOIN roles r ON u.role_id = r.id
    INNER JOIN chains c ON c.id = p.chain_id
    INNER JOIN games g ON c.game_id = g.id
    WHERE p.id = $1
  `;

  const result = await pool.query(query, [id]);
  return result.rows.length ? promptMapper.toDomain(result.rows[0]) : null;
}

async function getPromptsByChainId(chainId: number): Promise<Prompt[]> {
  const query = `
    SELECT
      p.id AS prompt_id,
      p.chain_id,
      p.index,
      p.text,
      p.user_id,
      p.created_at,
      u.google_sub,
      u.name,
      u.avatar_url,
      u.role_id,
      r.name as role_name,
      g.id AS game_id,
      g.started_at,
      g.url_id,
      c.id AS chain_id
    FROM prompts p
    INNER JOIN users u ON p.user_id = u.id
    INNER JOIN roles r ON u.role_id = r.id
    INNER JOIN chains c ON c.id = p.chain_id
    INNER JOIN games g ON c.game_id = g.id
    WHERE p.chain_id = $1
    ORDER BY p.index ASC
  `;

  const result = await pool.query(query, [chainId]);
  return result.rows.map(row => promptMapper.toDomain(row));
}

async function insertPrompt(prompt: PromptDto): Promise<Prompt | null> {
  const query = `
    WITH inserted_prompt AS (
      INSERT INTO prompts (chain_id, index, text, user_id)
      VALUES ($1, $2, $3, $4)
      RETURNING id, chain_id, index, text, user_id, created_at
    )
    SELECT
      p.id AS prompt_id,
      p.chain_id,
      p.index,
      p.text,
      p.user_id,
      p.created_at,
      u.google_sub,
      u.name,
      u.avatar_url,
      u.role_id,
      r.name as role_name,
      g.id AS game_id,
      g.started_at,
      g.url_id,
      c.id AS chain_id
    FROM inserted_prompt p
    INNER JOIN users u ON p.user_id = u.id
    INNER JOIN roles r ON u.role_id = r.id
    INNER JOIN chains c ON c.id = p.chain_id
    INNER JOIN games g ON c.game_id = g.id
  `;

  const result = await pool.query(
    query,
    [prompt.chainId, prompt.index, prompt.text, prompt.userId]
  );
  return result.rows.length ? promptMapper.toDomain(result.rows[0]) : null;
}

async function getLatestPromptByChainId(chainId: number): Promise<Prompt | null> {
  const query = `
    SELECT
      p.id AS prompt_id,
      p.chain_id,
      p.index,
      p.text,
      p.user_id,
      p.created_at,
      u.google_sub,
      u.name,
      u.avatar_url,
      u.role_id,
      r.name as role_name,
      g.id AS game_id,
      g.started_at,
      g.url_id,
      c.id AS chain_id
    FROM prompts p
    INNER JOIN users u ON p.user_id = u.id
    INNER JOIN roles r ON u.role_id = r.id
    INNER JOIN chains c ON c.id = p.chain_id
    INNER JOIN games g ON c.game_id = g.id
    WHERE p.chain_id = $1
    ORDER BY p.index DESC
    LIMIT 1
  `;

  const result = await pool.query(query, [chainId]);
  return result.rows.length? promptMapper.toDomain(result.rows[0]) : null;
}


export default {
  getPromptById,
  getPromptsByChainId,
  insertPrompt, 
  getLatestPromptByChainId
};