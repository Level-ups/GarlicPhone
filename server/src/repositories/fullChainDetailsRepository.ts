import { UUID } from "crypto";
import pool from "../library/db";
import { fullChainDetailMapper } from "../library/mappers";
import { FullChainDetail } from "../models/FullChainDetail";

export async function getFullChainDetailsByGameId(gameId: UUID): Promise<FullChainDetail[]> {
  const results = await pool.query(
    `SELECT 
      game_id,
      game_started_at,
      game_url_id,
      chain_id,
      chain_game_id,
      prompt_id,
      prompt_chain_id,
      prompt_index,
      prompt_text,
      prompt_created_at,
      image_id,
      image_s3_url,
      image_prompt_id,
      prompt_user_id,
      prompt_user_google_sub,
      prompt_user_name,
      prompt_user_avatar_url,
      prompt_user_role_id,
      prompt_user_role_name,
      image_user_id,
      image_user_google_sub,
      image_user_name,
      image_user_avatar_url,
      image_user_role_id,
      image_user_role_name
    FROM full_chain_details
    WHERE game_id = $1
    ORDER BY chain_id, prompt_index`,
    [gameId]
  );

  return fullChainDetailMapper.toDomain(results.rows);
}

export async function getFullChainDetailByChainId(chainId: number): Promise<FullChainDetail | null> {
  const results = await pool.query(
    `SELECT 
      game_id,
      game_started_at,
      game_url_id,
      chain_id,
      chain_game_id,
      prompt_id,
      prompt_chain_id,
      prompt_index,
      prompt_text,
      prompt_created_at,
      image_id,
      image_s3_url,
      image_prompt_id,
      prompt_user_id,
      prompt_user_google_sub,
      prompt_user_name,
      prompt_user_avatar_url,
      prompt_user_role_id,
      prompt_user_role_name,
      image_user_id,
      image_user_google_sub,
      image_user_name,
      image_user_avatar_url,
      image_user_role_id,
      image_user_role_name
    FROM full_chain_details
    WHERE chain_id = $1`,
    [chainId]
  );

  const chainDetails = fullChainDetailMapper.toDomain(results.rows);
  return chainDetails.length > 0 ? chainDetails[0] : null;
}

export default {
  getFullChainDetailsByGameId,
  getFullChainDetailByChainId
};