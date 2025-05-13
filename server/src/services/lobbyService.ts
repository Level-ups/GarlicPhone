import { Lobby, Player, validateLobbyCode } from '../models/Lobby';
import { UUID } from 'crypto';
import { ErrorDetails, NotFoundErrorDetails } from '../library/error-types';
import { Either } from '../library/types';
import { PhasePlayerAssignment } from '../models/GamePhase';
import * as lobbyRepository from '../repositories/lobbyRepository';

// Create a new lobby
export const createLobby = (hostId: string, hostName: string, hostAvatarUrl: string, maxPlayers = 10): Lobby => {
  // Validate maxPlayers
  if (maxPlayers < 2 || maxPlayers > 10) {
    throw new Error('Maximum players must be between 2 and 10');
  }
  
  return lobbyRepository.createLobby(hostId, hostName, hostAvatarUrl, maxPlayers);
};

// Join an existing lobby by code
export const joinLobbyByCode = (code: string, playerId: string, playerName: string, playerAvatarUrl: string): Lobby => {
  // Validate the lobby code format
  if (!validateLobbyCode(code)) {
    throw new Error('Invalid lobby code format');
  }
  
  // Find the lobby by code
  const lobby = lobbyRepository.getLobbyByCode(code);
  if (!lobby) {
    throw new Error('Lobby not found');
  }
  
  // Check if the lobby is already at maximum capacity
  if (lobby.players.length >= lobby.maxPlayers) {
    throw new Error('Lobby is full');
  }
  
  // Check if the lobby has already started
  if (lobby.status !== 'waiting') {
    throw new Error('Game has already started');
  }
  
  // Add player to the lobby
  const updatedLobby = lobbyRepository.addPlayerToLobby(lobby.id, {
    id: playerId,
    name: playerName,
    avatarUrl: playerAvatarUrl
  });
  
  if (!updatedLobby) {
    throw new Error('Failed to join lobby');
  }
  
  return updatedLobby;
};

// Leave a lobby
export const leaveLobby = (lobbyId: string, playerId: string): Lobby | undefined => {
  return lobbyRepository.removePlayerFromLobby(lobbyId, playerId);
};

// Set player ready status
export const setPlayerReady = (lobbyId: string, playerId: string, isReady: boolean): Lobby => {
  const updatedLobby = lobbyRepository.updatePlayerReadyStatus(lobbyId, playerId, isReady);
  if (!updatedLobby) {
    throw new Error('Failed to update player status');
  }
  return updatedLobby;
};

// Start the game
export const startGame = async (lobbyId: string, playerId: string): Promise<Lobby> => {
  const lobby = lobbyRepository.getLobbyById(lobbyId);
  if (!lobby) {
    throw new Error('Lobby not found');
  }
  
  // Check if the player is the host
  const player = lobby.players.find(p => p.id === playerId);
  if (!player || !player.isHost) {
    throw new Error('Only the host can start the game');
  }
  
  // Check if there are enough players (at least 2)
  if (lobby.players.length < 2) {
    throw new Error('Not enough players to start the game');
  }
  
  // Check if all players are ready
  const allPlayersReady = lobby.players.every(p => p.isReady || p.isHost);
  if (!allPlayersReady) {
    throw new Error('All players must be ready to start the game');
  }
  
  // Update the lobby status
  const updatedLobby = await lobbyRepository.updateLobbyStatus(lobbyId, 'started');
  if (!updatedLobby) {
    throw new Error('Failed to start the game');
  }
  
  return updatedLobby;
};

// Get a lobby by ID
export const getLobbyById = (lobbyId: string): Lobby => {
  const lobby = lobbyRepository.getLobbyById(lobbyId);
  if (!lobby) {
    throw new Error('Lobby not found');
  }
  return lobby;
};

// Get a lobby by code
export const getLobbyByCode = (code: string): Lobby => {
  // Validate the lobby code format
  if (!validateLobbyCode(code)) {
    throw new Error('Invalid lobby code format');
  }
  
  const lobby = lobbyRepository.getLobbyByCode(code);
  if (!lobby) {
    throw new Error('Lobby not found');
  }
  return lobby;
};

// End a game
export const endGame = async (lobbyId: string): Promise<Lobby | undefined> => {
  const updatedLobby = lobbyRepository.updateLobbyStatus(lobbyId, 'finished');
  if (!updatedLobby) {
    throw new Error('Failed to end the game');
  }
  return updatedLobby;
};

// Clean up expired lobbies
export const cleanupExpiredLobbies = (): void => {
  lobbyRepository.cleanupExpiredLobbies();
}; 

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

export async function updateLobbyPhase(lobbyId: UUID): Promise<Either<Lobby, ErrorDetails>> {
  const lobby = lobbyRepository.getLobbyById(lobbyId);
  if (!lobby) {
    return [undefined, new NotFoundErrorDetails("Lobby not found")];
  } else {
    // continue with the rest of the function
  }

  lobby.phases.moveToNextPhase();
  lobby.currentPhase = lobby.phases.getCurrentPhase();
  lobby.nextPhase = lobby.phases.peekNextPhase();

  
  return [lobby, undefined];
}
