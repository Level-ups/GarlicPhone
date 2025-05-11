import { Chain, ChainQueryResult } from "../models/Chain";
import { FullChainDetail, FullChainDetailQueryResult } from "../models/FullChainDetail";
import { Game, GameQueryResult } from "../models/Game";
import { Image, ImageQueryResult } from "../models/Image";
import { PlayerGame, PlayerGameQueryResult } from "../models/PlayerGames";
import { Prompt, PromptQueryResult } from "../models/Prompt";
import { User, UserQueryResult } from "../models/User";

export interface Mapper<PersistentType, DomainType> {
  toDomain(persistence: PersistentType): DomainType;
}

export const userMapper: Mapper<UserQueryResult, User> = {
  toDomain: (userQueryResult: UserQueryResult): User => {
    return {
      id: userQueryResult.user_id,
      googleSub: userQueryResult.google_sub,
      name: userQueryResult.name,
      avatarUrl: userQueryResult.avatar_url,
      role: {
        id: userQueryResult.role_id,
        name: userQueryResult.role_name,
      },
    }
  }
}

export const gameMapper: Mapper<GameQueryResult, Game> = {
  toDomain: (gameQueryResult: GameQueryResult) => ({
    id: gameQueryResult.game_id,
    urlId: gameQueryResult.url_id,
    startedAt: gameQueryResult.started_at
  })
}

export const playerGameMapper: Mapper<PlayerGameQueryResult, PlayerGame> = {
  toDomain: (playerGameQueryResult: PlayerGameQueryResult) => ({
    id: playerGameQueryResult.id,
    user: userMapper.toDomain(playerGameQueryResult),
    game: gameMapper.toDomain(playerGameQueryResult)
  })
}

export const chainMapper: Mapper<ChainQueryResult, Chain> = {
  toDomain: (chainQueryResult: ChainQueryResult) => ({
    id: chainQueryResult.chain_id,
    game: gameMapper.toDomain(chainQueryResult)
  })
}

export const promptMapper: Mapper<PromptQueryResult, Prompt> = {
  toDomain: (promptQueryResult: PromptQueryResult): Prompt => {
    return {
      id: promptQueryResult.prompt_id,
      chain: chainMapper.toDomain(promptQueryResult),
      index: promptQueryResult.index,
      text: promptQueryResult.text,
      user: userMapper.toDomain(promptQueryResult),
      createdAt: promptQueryResult.created_at
    };
  }
};

export const imageMapper: Mapper<ImageQueryResult, Image> = {
  toDomain: (imageQueryResult: ImageQueryResult): Image => {
    return {
      id: imageQueryResult.image_id,
      s3Url: imageQueryResult.s3_url,
      prompt: promptMapper.toDomain(imageQueryResult),
      user: userMapper.toDomain(imageQueryResult),
    };
  }
};

export const fullChainDetailMapper: Mapper<FullChainDetailQueryResult[], FullChainDetail[]> = {
  toDomain: (fullChainDetailQueryResults: FullChainDetailQueryResult[]): FullChainDetail[] => {
    if (!fullChainDetailQueryResults.length) {
      return [];
    }
    
    // Group results by chain_id
    const resultsByChainId = fullChainDetailQueryResults.reduce<Record<number, FullChainDetailQueryResult[]>>((acc, result) => {
      const chainId = result.chain_id;
      if (!acc[chainId]) {
        acc[chainId] = [];
      }
      acc[chainId].push(result);
      return acc;
    }, {});
    
    // Map each group to a FullChainDetail
    return Object.values(resultsByChainId).map(chainResults => {
      const firstResult = chainResults[0];
      
      // Create the game object
      const game: Game = gameMapper.toDomain(firstResult);

      // Create the chain object
      const chain: Chain = {
        id: firstResult.chain_id,
        game: game,
      };

      // Map through all results to create prompts array
      const prompts = chainResults.map(result => {
        // Create the prompt author
        const promptAuthor: User = {
          id: result.prompt_user_id,
          googleSub: result.prompt_user_google_sub,
          name: result.prompt_user_name,
          avatarUrl: result.prompt_user_avatar_url,
          role: {
            id: result.prompt_user_role_id,
            name: result.prompt_user_role_name
          }
        };

        // Create the prompt
        const prompt: Prompt = {
          id: result.prompt_id,
          chain: chain,
          index: result.prompt_index,
          text: result.prompt_text,
          user: promptAuthor,
          createdAt: new Date(result.prompt_created_at)
        };

        // Create the image (if it exists)
        let image: Image | null = null;
        if (result.image_id) {
          // Create the image author (if it exists)
          const imageAuthor: User = {
            id: result.image_user_id!,
            googleSub: result.image_user_google_sub!,
            name: result.image_user_name!,
            avatarUrl: result.image_user_avatar_url!,
            role: {
              id: result.image_user_role_id!,
              name: result.image_user_role_name!
            }
          };

          image = {
            id: result.image_id,
            s3Url: result.image_s3_url!,
            prompt: prompt,
            user: imageAuthor
          };
        }

        return {
          prompt,
          image,
          author: promptAuthor
        };
      });

      // Create the full chain detail
      return {
        game,
        chain,
        prompts
      };
    });
  }
}