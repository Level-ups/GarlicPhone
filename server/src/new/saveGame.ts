import pool from "../library/db";
import { Game } from "../models/Game";
import chainRepository from "../repositories/chainRepository";
import gameRepository from "../repositories/gameRepository"
import imageRepository from "../repositories/imageRepository";
import promptRepository from "../repositories/promptRepository";
import { ChainImage, ChainPrompt, GameData } from "./gameTypes"

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
    game.chains.forEach(async (chain, chainIndex) => {
      const chainId = createdChains[chainIndex]!.id;

      chain.links.forEach(async (link, phaseIndex) => {
        const prompt = link as ChainPrompt;
        const image = link as ChainImage;
        const playerId = game.players[getPlayerIndexFromChainIndex(chainIndex, phaseIndex, numberOfPlayers)]; // TODO: Might be an off by one error here.

        if (prompt.prompt) {
          const insertedPrompt = await promptRepository.insertPrompt({
            chainId,
            index: phaseIndex,
            text: prompt.prompt,
            userId: playerId
          }, client);
          if (!insertedPrompt) {
            await client.query('ROLLBACK');
            return "CouldNotCreatePrompts";
          }
        } else if (image.url) {
          const insertedImage = await imageRepository.insertImage({
            chainId,
            s3Url: image.url,
            userId: playerId
          }, client);
          if (!insertedImage) {
            await client.query('ROLLBACK');
            return "CouldNotCreateImages";
          }
        }
      })
    });

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
