import { UUID } from "crypto";
import { ErrorDetails, InsertErrorDetails, NotFoundErrorDetails, UpdatedErrorDetails } from "../library/error-types";
import { Either } from "../library/types";
import { Chain } from "../models/Chain";
import { Lobby, PhasePlayerAssignment } from "../models/Lobby";
import { User } from "../models/User";
import chainRepository from "../repositories/chainRepository";
import lobbyRepository from "../repositories/lobbyRepository";
import userRepository from "../repositories/userRepository";
import gameService from "./gameService";

export async function createLobby(ownerId: string, chainSize: number = 5): Promise<Either<Lobby, ErrorDetails>>  {
  let owner: User | null;
  try {
    owner = await userRepository.findUserById(ownerId);
  } catch (error: any) {
    return [undefined, new ErrorDetails("Error finding user", [error.message])];
  }
  if (!owner) {
    return [undefined, new NotFoundErrorDetails("User not found")]
  } else {
    const lobby = lobbyRepository.createLobby(owner, chainSize);
    if (lobby) {
      return [lobby, undefined];
    } else {
      return [undefined, new InsertErrorDetails("Could not create lobby")];
    }
  }
}

export async function getAllLobbies(): Promise<Either<Lobby[], ErrorDetails>> {
  const lobbies = lobbyRepository.getAllLobbies();
  return [lobbies, undefined];
}

export async function getLobbyById(lobbyId: UUID): Promise<Either<Lobby, ErrorDetails>> {
  const lobby = lobbyRepository.getLobbyById(lobbyId);
  if (!lobby) {
    return [undefined, new NotFoundErrorDetails("Lobby not found")];
  } else {
    return [lobby, undefined];
  }
}

export async function addPlayerToLobby(lobbyId: UUID, userId: string): Promise<Either<Lobby, ErrorDetails>> {
  let user: User | null;
  
  try {
    user = await userRepository.findUserById(userId);
  } catch (error: any) {
    return [undefined, new ErrorDetails("Error finding user", [error.message])];
  }

  const lobby = lobbyRepository.getLobbyById(lobbyId);
  if (!user) {
    return [undefined, new NotFoundErrorDetails("User not found")];
  } else if (!lobby) {
    return [undefined, new NotFoundErrorDetails("Lobby not found")];
  } else {
    const joinedLobby = lobbyRepository.addPlayerToLobby(lobbyId, user);
    if (!joinedLobby) {
      return [undefined, new InsertErrorDetails("Could not add player to lobby")];
    } else {
      return [joinedLobby, undefined];
    }
  }
}

export async function updateLobbyPhase(lobbyCode: UUID): Promise<Either<Lobby, ErrorDetails>> {
  const lobby = lobbyRepository.getLobbyById(lobbyCode);
  if (!lobby) {
    return [undefined, new NotFoundErrorDetails("Lobby not found")];
  } else {
    // continue with the rest of the function
  }

  if (lobby.nextPhase.phase === "Prompt") {
    const [lobbyState, error] = await performGameStartActivities(lobby);
    if (error) {
      return [undefined, error];
    } else {
      // don't return yet
    }
  } else {
    // no need to perform any actions
  }

  const updatedLobby = lobbyRepository.updateLobbyPhase(lobbyCode);
  
  if (!updatedLobby) {
    return [undefined, new UpdatedErrorDetails("Could not update lobby phase")];
  } else {
    return [updatedLobby, undefined];
  }
}

async function performGameStartActivities(lobby: Lobby): Promise<Either<Lobby, ErrorDetails>> {
  const [game, gameCreationError] = await gameService.createGame({
    urlId: lobby.code,
    startedAt: new Date(),
  });

  if (!game) {
    return [undefined, gameCreationError];
  } else {
    // don't return yet 
  }
  
  lobby.setGame(game);

  if (!lobby.game) {
    return [undefined, new ErrorDetails("Game already exists")];
  } else {
    // continue with the rest of the function
  }

  let chains: Chain[] = [];
  for (const player of lobby.players) {
    const chain = await chainRepository.insertChain({
      gameId: lobby.game.id
    });
    if (!chain) {
      return [undefined, new InsertErrorDetails("Could not create chain")];
    } else {
      chains.push(chain);
    }
  }

  lobby.assignPlayersAndPhases(lobby.chainSize, chains);

  return [lobby, undefined];
}

export async function removePlayerFromLobby(lobbyId: UUID, userId: string): Promise<Either<Lobby, ErrorDetails>> {
  let user: User | null;
  
  try {
    user = await userRepository.findUserById(userId);
  } catch (error: any) {
    return [undefined, new ErrorDetails("Error finding user", [error.message])];
  }

  const lobby = lobbyRepository.getLobbyById(lobbyId);
  
  if (!user) {
    return [undefined, new NotFoundErrorDetails("User not found")];
  } else if (!lobby) {
    return [undefined, new NotFoundErrorDetails("Lobby not found")];
  } else {
    const removedLobby = lobbyRepository.removePlayerFromLobby(lobbyId, user);
    if (!removedLobby) {
      return [undefined, new UpdatedErrorDetails("Could not remove player from lobby")];
    } else {
      return [removedLobby, undefined];
    }
  }
}

export async function getLobbyPhaseByIndex(lobbyId: UUID, index: number): Promise<Either<PhasePlayerAssignment, ErrorDetails>> {
  const lobby = lobbyRepository.getLobbyById(lobbyId);
  if (!lobby) {
    return [undefined, new NotFoundErrorDetails("Lobby not found")];
  } else {
    // continue with the rest of the function
  }

  const phase = lobby.getPhaseByIndex(index);
  if (!phase) {
    return [undefined, new NotFoundErrorDetails("Phase not found")];
  } else {
    return [phase, undefined];
  }
}

export async function getLobbyPhases(lobbyId: UUID): Promise<Either<PhasePlayerAssignment[], ErrorDetails>> {
  const lobby = lobbyRepository.getLobbyById(lobbyId);
  if (!lobby) {
    return [undefined, new NotFoundErrorDetails("Lobby not found")];
  } else {
    // continue with the rest of the function
  }

  const phases = lobby.phasePlayerAssignments;
  if (!phases) {
    return [undefined, new NotFoundErrorDetails("Phases not found")];
  } else {
    return [phases, undefined];
  }
}

export default {
  createLobby,
  getAllLobbies,
  getLobbyById,
  addPlayerToLobby,
  updateLobbyPhase,
  removePlayerFromLobby,
  getLobbyPhaseByIndex,
  getLobbyPhases
}