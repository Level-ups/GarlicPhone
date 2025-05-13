import { UUID } from 'crypto';
import { constants } from '../library/constants';
import { ErrorDetails, InsertErrorDetails, NotFoundErrorDetails, UnauthorizedErrorDetails, UpdatedErrorDetails } from '../library/error-types';
import { broadcastLobbyUpdate } from '../library/lobbyEventBroadcaster';
import { Either } from '../library/types';
import { Lobby } from '../models/Lobby';
import { PhasePlayerAssignment } from "../models/PhasePlayerAssignment";
import * as lobbyRepository from '../repositories/lobbyRepository';

// Create a new lobby
export const createLobby = (hostId: number, hostName: string, hostAvatarUrl: string, maxPlayers = constants.MAXIMUM_PLAYERS): Either<Lobby, ErrorDetails> => {
  // Validate maxPlayers
  if (maxPlayers < constants.MINIMUM_PLAYERS || maxPlayers > constants.MAXIMUM_PLAYERS) {
    return [undefined, new ErrorDetails(`Invalid maxPlayers value. Must be between ${constants.MINIMUM_PLAYERS} and ${constants.MAXIMUM_PLAYERS}.`)];
  }
  
  const createdLobby = lobbyRepository.createLobby(hostId, hostName, hostAvatarUrl, maxPlayers);
  if (!createdLobby) {
    return [undefined, new ErrorDetails('Failed to create lobby')];
  } else {
    return [createdLobby, undefined];
  }
};

// Join an existing lobby by code
export const joinLobbyByCode = (code: string, playerId: number, playerName: string, playerAvatarUrl: string): Either<Lobby, ErrorDetails> => {
 
  // Find the lobby by code
  const lobby = lobbyRepository.getLobbyByCode(code);
  if (!lobby) {
    return [undefined, new NotFoundErrorDetails('Lobby not found')];
  }
  
  // Check if the lobby is already at maximum capacity
  if (lobby.players.length >= lobby.maxPlayers) {
    return [undefined, new ErrorDetails('Lobby is full')];
  }
  
  // Check if the lobby has already started
  if (lobby.status !== 'waiting') {
    return [undefined, new ErrorDetails('Lobby has already started')];
  }
  
  // Add player to the lobby
  const updatedLobby = lobbyRepository.addPlayerToLobby(lobby.id, {
    id: playerId,
    name: playerName,
    avatarUrl: playerAvatarUrl
  });
  
  if (!updatedLobby) {
    return [undefined, new InsertErrorDetails('Failed to join lobby')];
  }
  
  return updatedLobby;
};

// Leave a lobby
export const leaveLobby = (lobbyId: UUID, playerId: number): Either<Lobby, ErrorDetails> => {
  return lobbyRepository.removePlayerFromLobby(lobbyId, playerId);
};

// Set player ready status
export const setPlayerReady = (lobbyId: UUID, playerId: number, isReady: boolean): Either<Lobby, ErrorDetails> => {
  return lobbyRepository.updatePlayerReadyStatus(lobbyId, playerId, isReady);
};

// Start the game
export const startGame = async (lobbyId: UUID, playerId: number): Promise<Either<Lobby, ErrorDetails>> => {
  const lobby = lobbyRepository.getLobbyById(lobbyId);
  if (!lobby) {
    return [undefined, new NotFoundErrorDetails(`Lobby with id ${lobbyId} could not be found`)];
  }
  
  // Check if the player is the host
  const player = lobby.players.find(p => p.id === playerId);
  if (!player || !player.isHost) {
    return [undefined, new UnauthorizedErrorDetails(`Only the host can start the game. PlayerId: ${playerId} is not the host.`)];
  }
  
  // Check if there are enough players (at least 2)
  if (lobby.players.length < constants.MINIMUM_PLAYERS) {
    return [undefined, new UpdatedErrorDetails('Not enough players to start the game')];
  }
  
  // Check if all players are ready
  const allPlayersReady = lobby.players.every(p => p.isReady || p.isHost);
  if (!allPlayersReady) {
    return [undefined, new UpdatedErrorDetails('Not all players are ready')];
  }
  
  // Update the lobby status
  const updatedLobby = await lobbyRepository.updateLobbyStatus(lobbyId, 'started');
  if (!updatedLobby) {
    return [undefined, new UpdatedErrorDetails('Failed to start the game')];
  } else {
    return [updatedLobby, undefined];
  }
};

// Get a lobby by ID
export const getLobbyById = (lobbyId: string): Either<Lobby, ErrorDetails> => {
  const lobby = lobbyRepository.getLobbyById(lobbyId);
  if (!lobby) {
    return [undefined, new NotFoundErrorDetails(`Lobby with id ${lobbyId} could not be found`)];
  } else {
    return [lobby, undefined];
  }
};

// Get a lobby by code
export const getLobbyByCode = (code: string): Either<Lobby, ErrorDetails> => {  
  const lobby = lobbyRepository.getLobbyByCode(code);
  if (!lobby) {
    return [undefined, new NotFoundErrorDetails('Lobby not found')];
  } else {
    return [lobby, undefined];
  }
};

// End a game
export const endGame = async (lobbyId: UUID): Promise<Either<Lobby, ErrorDetails>> => {
  const updatedLobby = await lobbyRepository.updateLobbyStatus(lobbyId, 'finished');
  if (!updatedLobby) {
    return [undefined, new ErrorDetails('Failed to end the game')];
  } else {
    return [updatedLobby, undefined];
  }
};

// Clean up expired lobbies
export const cleanupExpiredLobbies = (): void => {
  lobbyRepository.cleanupExpiredLobbies();
}; 

export async function getLobbyPhases(lobbyId: UUID): Promise<Either<PhasePlayerAssignment[], ErrorDetails>> {
  const lobby = lobbyRepository.getLobbyById(lobbyId);
  if (!lobby) {
    return [undefined, new NotFoundErrorDetails(`Lobby with id ${lobbyId} could not be found`)];
  }

  const phases = lobby.phasePlayerAssignments;
  if (!phases) {
    return [undefined, new NotFoundErrorDetails("Phases not found")];
  } else {
    return [phases, undefined];
  }
}

export async function updateLobbyPhase(lobbyId: UUID): Promise<Either<Lobby, ErrorDetails>> {

  const lobby = lobbyRepository.getLobbyById(lobbyId);
  
  if (!lobby) {
    return [undefined, new NotFoundErrorDetails(`Lobby with id ${lobbyId} could not be found`)];
  } else {
    // continue with the rest of the function
  }

  lobby.phases.moveToNextPhase();

  // Broadcast the lobby update to all connected clients
  broadcastLobbyUpdate(lobby);
  
  return [lobby, undefined];
}