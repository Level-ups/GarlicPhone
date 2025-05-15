import { UUID } from 'crypto';
import { Either } from '../../../lib/types';
import { constants } from '../library/constants';
import { ErrorDetails, InsertErrorDetails, NotFoundErrorDetails } from '../library/error-types';
import { broadcastLobbyUpdate } from '../library/lobbyEventBroadcaster';
import { deepCloneWithPrototype } from '../library/utils';
import { Chain } from '../models/Chain';
import { GamePhaseList } from '../models/GamePhase';
import { generateLobbyCode, Lobby, LobbyStatus } from '../models/Lobby';
import { PhasePlayerAssignment } from "../models/PhasePlayerAssignment";
import { Player } from '../models/Player';
import gameService from '../services/gameService';
import chainRepository from './chainRepository';

// In-memory storage for lobbies
const lobbies: Map<string, Lobby> = new Map();
// Map from lobby code to lobby id for quick lookup
const lobbyCodeMap: Map<string, string> = new Map();
const lobbyTimers = new Map<string, NodeJS.Timeout>();

export const createLobby = (hostId: number, hostName: string, hostAvatarUrl: string, maxPlayers = 10): Lobby => {
  const id = crypto.randomUUID();
  const code = generateUniqueCode();
  
  const host: Player = {
    id: hostId,
    name: hostName,
    avatarUrl: hostAvatarUrl,
    isHost: true,
    isReady: false
  };

  const phases: GamePhaseList = new GamePhaseList();
  
  const lobby: Lobby = {
    id,
    code,
    players: [host],
    maxPlayers,
    status: 'waiting',
    createdAt: new Date(),
    lastActivity: new Date(),
    phases: phases,
    phasePlayerAssignments: [],
  };
  
  lobbies.set(id, lobby);
  lobbyCodeMap.set(code, id);
  
  return lobby;
};

export const getLobbyById = (id: string): Lobby | undefined => {
  return lobbies.get(id);
};

export const getLobbyByCode = (code: string): Lobby | undefined => {
  const id = lobbyCodeMap.get(code);
  if (!id) return undefined;
  return lobbies.get(id);
};

export const addPlayerToLobby = (lobbyId: UUID, player: Omit<Player, 'isHost' | 'isReady'>): Either<Lobby, ErrorDetails> => {
  const lobby = lobbies.get(lobbyId);
  if (!lobby) return [undefined, new NotFoundErrorDetails(`Lobby with ID ${lobbyId} not found`)];
  
  // Check if lobby is full
  if (lobby.players.length >= lobby.maxPlayers) {
    return [undefined, new ErrorDetails(`Lobby is full (max players: ${lobby.maxPlayers})`)];
  }
  
  // Check if player is already in the lobby
  if (!lobby.players.some(p => p.id === player.id)) {
    const newPlayer: Player = {
      ...player,
      isHost: false,
      isReady: false
    };
    
    lobby.players.push(newPlayer);
    lobby.lastActivity = new Date();
    lobbies.set(lobbyId, lobby);
  }

  // Broadcast the lobby update to all connected clients
  broadcastLobbyUpdate(lobby);
  
  return [lobby, undefined];
};

export const removePlayerFromLobby = (lobbyId: UUID, playerId: number): Either<Lobby, ErrorDetails> => {
  const lobby = lobbies.get(lobbyId);
  if (!lobby) return [undefined, new NotFoundErrorDetails(`Lobby with ID ${lobbyId} not found`)];
  
  const playerIndex = lobby.players.findIndex(p => p.id === playerId);
  if (playerIndex === -1) return [undefined, new NotFoundErrorDetails(`Player with ID ${playerId} not found in lobby`)];
  
  const isHost = lobby.players[playerIndex].isHost;
  
  // Remove the player
  lobby.players.splice(playerIndex, 1);
  lobby.lastActivity = new Date();
  
  // If the host left and there are still players, assign a new host
  if (isHost && lobby.players.length > 0) {
    lobby.players[0].isHost = true;
  }
  
  // If no players left, remove the lobby
  if (lobby.players.length === 0) {
    if (lobbyTimers.has(lobbyId)) {
      clearInterval(lobbyTimers.get(lobbyId)!);
      lobbyTimers.delete(lobbyId);
    }
    lobbies.delete(lobbyId);
    lobbyCodeMap.delete(lobby.code);
    return [undefined, new NotFoundErrorDetails(`Lobby with ID ${lobbyId} not found`)];
  }
  
  lobbies.set(lobbyId, lobby);
  
  // Broadcast the lobby update to all connected clients
  broadcastLobbyUpdate(lobby);
  
  return [lobby, undefined];
};

export const updatePlayerReadyStatus = (lobbyId: UUID, playerId: number, isReady: boolean): Either<Lobby, ErrorDetails> => {
  const lobby = lobbies.get(lobbyId);
  if (!lobby) return [undefined, new NotFoundErrorDetails(`Lobby with ID ${lobbyId} not found`)];
  
  const player = lobby.players.find(p => p.id === playerId);
  if (!player) return [undefined, new NotFoundErrorDetails(`Player with ID ${playerId} not found in lobby`)];
  
  player.isReady = isReady;
  lobby.lastActivity = new Date();
  lobbies.set(lobbyId, lobby);
  
  // Broadcast the lobby update to all connected clients
  broadcastLobbyUpdate(lobby);
  
  return [lobby, undefined];
};


export const updateLobbyStatus = async (lobbyId: UUID, status: LobbyStatus): Promise<Lobby | undefined> => {
  const lobby = lobbies.get(lobbyId);
  if (!lobby) return undefined;

  if (lobbyTimers.has(lobbyId)) {
    clearInterval(lobbyTimers.get(lobbyId)!);
    lobbyTimers.delete(lobbyId);
  }

  if (lobby.phases.peekNextPhase()?.phase === "Prompt") {
    const [lobbyState, error] = await performGameStartActivities(lobby);
    if (error) {
      return undefined
    } else {
      lobby.phases.moveToNextPhase();
    }
  }

  if (lobby.phases.getCurrentPhase()?.phase === "Prompt") {
    const intervalId = setInterval(() => {
      const updatedLobby = lobbies.get(lobbyId);

      // Schedule the pre-callback 5 seconds before the main one
      setTimeout(() => {
        if (updatedLobby) broadcastLobbyUpdate(updatedLobby, 'before_lobby_update');
        console.log('before_lobby_update', new Date());
      }, constants.ROUND_LENGTH_MILLISECONDS - constants.UPLOAD_LENGTH_MILLISECONDS);
  
      // Schedule the main callback at the actual interval
      setTimeout(() => {
        if (!updatedLobby?.phases.peekNextPhase()) return;

        updatedLobby.phases.moveToNextPhase();
        broadcastLobbyUpdate(updatedLobby);
        console.log('during_lobby_update', new Date());

        if (updatedLobby.phases.getCurrentPhase().phase === 'Review') {
          clearInterval(intervalId);
          lobbyTimers.delete(lobbyId);
        }
      }, constants.ROUND_LENGTH_MILLISECONDS);

      setTimeout(() => {
        if (updatedLobby) broadcastLobbyUpdate(updatedLobby, 'after_lobby_update');
        console.log('after_lobby_update', new Date());
      }, constants.ROUND_LENGTH_MILLISECONDS + constants.UPLOAD_LENGTH_MILLISECONDS);
  
    }, constants.ROUND_LENGTH_MILLISECONDS);
    
    lobbyTimers.set(lobbyId, intervalId);
  }

  lobbies.set(lobbyId, lobby);
  broadcastLobbyUpdate(lobby);
  return lobby;
};

async function performGameStartActivities(lobby: Lobby): Promise<Either<Lobby, ErrorDetails>> {
  const [game, gameCreationError] = await gameService.createGame({
    urlId: lobby.id,
    startedAt: new Date(),
  });

  if (!game) {
    return [undefined, gameCreationError];
  }

  for (let i = 0; i < lobby.players.length - 1; i++) {
    lobby.phases.addNextGameLoopPhase(); // This should add Draw, then Guess, etc.
  }
  lobby.phases.addReviewAndCompletePhase();

  const [chains, chainCreationError] = await createChainsForPlayers(game.id, lobby.players);
  if (chainCreationError) {
    return [undefined, chainCreationError];
  }

  lobby.phasePlayerAssignments = assignPlayersAndPhases(lobby.players, lobby.phases, chains);

  return [lobby, undefined];
}

async function createChainsForPlayers(gameId: number, players: Player[]): Promise<Either<Chain[], InsertErrorDetails>> {
  const chains: Chain[] = [];
  for (const _player of players) { // Create one chain per player
    const chain = await chainRepository.insertChain({
      gameId: gameId
    });
    if (!chain) {
      return [undefined, new InsertErrorDetails("Could not create chain")];
    }
    chains.push(chain);
  }
  return [chains, undefined];
}

function assignPlayersAndPhases(players: Player[], phases: GamePhaseList, chains: Chain[]) {

    const assignments: PhasePlayerAssignment[] = [];
    chains.forEach((chain, cIndex) => {
      phases.phases.forEach((phase, pIndex) => {
        const player = players[(cIndex + pIndex) % players.length];
        assignments.push({
          phase,
          player,
          chain
        })
      })
    })

    return assignments;

}



export const getAllLobbies = (): Lobby[] => {
  return Array.from(lobbies.values());
};

// Helper to generate a unique lobby code
function generateUniqueCode(): string {
  let code: string;
  let attempts = 0;
  const maxAttempts = 10;
  
  do {
    code = generateLobbyCode();
    attempts++;
  } while (lobbyCodeMap.has(code) && attempts < maxAttempts);
  
  if (attempts >= maxAttempts) {
    // If we couldn't generate a unique code after maxAttempts, add a timestamp suffix
    code = generateLobbyCode() + Date.now().toString().substring(9, 12);
  }
  
  return code;
}

// Clean up expired lobbies (those with no activity for more than 24 hours)
export const cleanupExpiredLobbies = (): void => {
  const now = new Date();
  const expirationTime = process.env.LOBBY_EXPIRATION_TIME_MILLISECOND ? parseInt(process.env.LOBBY_EXPIRATION_TIME_MILLISECOND) : 24 * 60 * 60 * 1000;
  
  for (const [id, lobby] of lobbies.entries()) {
    const timeSinceLastActivity = now.getTime() - lobby.lastActivity.getTime();
    if (timeSinceLastActivity > expirationTime) {
      lobbies.delete(id);
      lobbyCodeMap.delete(lobby.code);
    }
  }
};