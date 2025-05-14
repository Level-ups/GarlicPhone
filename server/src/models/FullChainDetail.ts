import { Chain } from "./Chain";
import { Game, GameQueryResult } from "./Game";
import { Image } from "./Image";
import { Prompt } from "./Prompt";
import { User } from "./User";

export type FullChainDetail = {
  game: Game,
  chain: Chain,
  prompts: {
    prompt: Prompt,
    image: Image | null,
    author: User,
  }[],
}

export type FullChainDetailQueryResult = GameQueryResult & {  
  // Chain Details
  chain_id: number;
  chain_game_id: number;
  
  // Prompt Details
  prompt_id: number;
  prompt_chain_id: number;
  prompt_index: number;
  prompt_text: string;
  prompt_created_at: string;  // ISO datetime string
  
  // Image Details (nullable)
  image_id: number | null;
  image_s3_url: string | null;
  image_prompt_id: number | null;
  
  // Prompt Author Details
  prompt_user_id: number;
  prompt_user_google_sub: string;
  prompt_user_name: string;
  prompt_user_avatar_url: string | null;
  prompt_user_role_id: number;
  
  // Image Author Details (nullable)
  image_user_id: number | null;
  image_user_google_sub: string | null;
  image_user_name: string | null;
  image_user_avatar_url: string | null;
  image_user_role_id: number | null;

  prompt_user_role_name: string;
  
  image_user_role_name: string | null;
}