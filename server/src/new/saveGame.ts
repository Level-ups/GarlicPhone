import pool from "../library/db";
import chainRepository from "../repositories/chainRepository";
import gameRepository from "../repositories/gameRepository";
import imageRepository from "../repositories/imageRepository";
import promptRepository from "../repositories/promptRepository";
import { ChainImage, ChainPrompt, GameData } from "./gameTypes";

function getPlayerIndexFromChainIndex(chainIndex: number, phase: number, numPlayers: number): number {
  return (chainIndex - phase + 1 + numPlayers) % numPlayers;
}

export type SaveGameDataToDbResult = "success" | "CouldNotCreateGame" | "CouldNotCreateChains" | "CouldNotCreatePrompts" | "CouldNotCreateImages";
export async function saveGameDataToDb (game: GameData): Promise<SaveGameDataToDbResult> {
  const client = await pool.connect()
  try {
    //---------- Begin transaction ----------//
    await client.query('BEGIN')
    const numberOfPlayers = game.chains.length;

    //---------- Insert Game ----------//
    const createdGame = await gameRepository.insertGameWithStartedAt(new Date(game.createdAt), client);
    if (!createdGame) {
      await client.query('ROLLBACK');
      return "CouldNotCreateGame";
    }
    const gameId = createdGame.id;

    //---------- Insert chains ----------//
    const chainPromises = game.chains.map(async (chain) => {
      return chainRepository.insertChain({
        gameId
      }, client);
    });

    //---------- We don't actually care about the order of chains ----------//
    const createdChains = await Promise.all(chainPromises);

    //---------- Assert that all chains have been created ----------//
    if (createdChains.find((chain) => chain == null)) {
      await client.query('ROLLBACK');
      return "CouldNotCreateChains";
    }

    //---------- Save links as prompts for each game ----------//
    // Use Promise.all to properly await all async operations
    const chainPromptPromises = [];
    
    for (let chainIndex = 0; chainIndex < game.chains.length; chainIndex++) {
      const chain = game.chains[chainIndex];
      const chainId = createdChains[chainIndex]!.id;
      
      // Process each link sequentially within a chain to maintain order
      for (let phaseIndex = 0; phaseIndex < chain.links.length; phaseIndex++) {
        const link = chain.links[phaseIndex];
        const prompt = link as ChainPrompt;
        const image = link as ChainImage;
        const playerId = game.players[getPlayerIndexFromChainIndex(chainIndex, phaseIndex, numberOfPlayers)];
        
        // Create a promise for this link's processing
        const linkPromise = (async () => {
          if (prompt.prompt) {
            const insertedPrompt = await promptRepository.insertPrompt({
              chainId,
              index: phaseIndex,
              text: prompt.prompt,
              userId: playerId
            }, client);
            
            if (!insertedPrompt) {
              throw new Error("CouldNotCreatePrompts");
            }
            
            return insertedPrompt;
          } else if (image.url) {
            // First create a prompt to associate with the image
            const insertedPrompt = await promptRepository.insertPrompt({
              chainId,
              index: phaseIndex,
              text: "", // Empty text for image prompts
              userId: playerId
            }, client);
            
            if (!insertedPrompt) {
              throw new Error("CouldNotCreatePrompts");
            }
            
            // Then create the image with the prompt ID
            const insertedImage = await imageRepository.insertImage({
              s3Url: image.url,
              chainId: insertedPrompt.id, // The chainId parameter is actually used as prompt_id in the implementation
              userId: playerId
            }, client);
            
            if (!insertedImage) {
              throw new Error("CouldNotCreateImages");
            }
            
            return insertedImage;
          }
        })();
        
        chainPromptPromises.push(linkPromise);
      }
    }
    
    try {
      // Wait for all link operations to complete
      await Promise.all(chainPromptPromises);
    } catch (error: any) {
      await client.query('ROLLBACK');
      if (error.message === "CouldNotCreatePrompts") {
        return "CouldNotCreatePrompts";
      } else if (error.message === "CouldNotCreateImages") {
        return "CouldNotCreateImages";
      }
      throw error;
    }

    //---------- Commit changes ----------//
    await client.query('COMMIT');
    return "success";
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}
