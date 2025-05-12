import { randomBytes } from 'crypto';
import { Lobby, Player, generateLobbyCode } from '../models/Lobby';
import { broadcastLobbyUpdate } from '../library/lobbyEventBroadcaster';

// In-memory storage for lobbies
const lobbies: Map<string, Lobby> = new Map();
// Map from lobby code to lobby id for quick lookup
const lobbyCodeMap: Map<string, string> = new Map();

// Generate a unique ID using Node's built-in crypto module
function generateUniqueId(): string {
  return randomBytes(16).toString('hex');
}

export const createLobby = (hostId: string, hostName: string, hostAvatarUrl: string, maxPlayers = 10): Lobby => {
  const id = generateUniqueId();
  const code = generateUniqueCode();
  
  const host: Player = {
    id: hostId,
    name: hostName,
    avatarUrl: hostAvatarUrl,
    isHost: true,
    isReady: false
  };
  
  const lobby: Lobby = {
    id,
    code,
    players: [host],
    maxPlayers,
    status: 'waiting',
    createdAt: new Date(),
    lastActivity: new Date()
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

export const addPlayerToLobby = (lobbyId: string, player: Omit<Player, 'isHost' | 'isReady'>): Lobby | undefined => {
  const lobby = lobbies.get(lobbyId);
  if (!lobby) return undefined;
  
  // Check if lobby is full
  if (lobby.players.length >= lobby.maxPlayers) {
    return undefined;
  }
  
  // Check if player is already in the lobby
  if (lobby.players.some(p => p.id === player.id)) {
    return undefined;
  }
  
  const newPlayer: Player = {
    ...player,
    isHost: false,
    isReady: false
  };
  
  lobby.players.push(newPlayer);
  lobby.lastActivity = new Date();
  lobbies.set(lobbyId, lobby);
  
  // Broadcast the lobby update to all connected clients
  broadcastLobbyUpdate(lobby);
  
  return lobby;
};

export const removePlayerFromLobby = (lobbyId: string, playerId: string): Lobby | undefined => {
  const lobby = lobbies.get(lobbyId);
  if (!lobby) return undefined;
  
  const playerIndex = lobby.players.findIndex(p => p.id === playerId);
  if (playerIndex === -1) return undefined;
  
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
    lobbies.delete(lobbyId);
    lobbyCodeMap.delete(lobby.code);
    return undefined;
  }
  
  lobbies.set(lobbyId, lobby);
  
  // Broadcast the lobby update to all connected clients
  broadcastLobbyUpdate(lobby);
  
  return lobby;
};

export const updatePlayerReadyStatus = (lobbyId: string, playerId: string, isReady: boolean): Lobby | undefined => {
  const lobby = lobbies.get(lobbyId);
  if (!lobby) return undefined;
  
  const player = lobby.players.find(p => p.id === playerId);
  if (!player) return undefined;
  
  player.isReady = isReady;
  lobby.lastActivity = new Date();
  lobbies.set(lobbyId, lobby);
  
  // Broadcast the lobby update to all connected clients
  broadcastLobbyUpdate(lobby);
  
  return lobby;
};

export const updateLobbyStatus = (lobbyId: string, status: Lobby['status']): Lobby | undefined => {
  const lobby = lobbies.get(lobbyId);
  if (!lobby) return undefined;
  
  lobby.status = status;
  lobby.lastActivity = new Date();
  lobbies.set(lobbyId, lobby);
  
  // Broadcast the lobby update to all connected clients
  broadcastLobbyUpdate(lobby);
  
  return lobby;
};

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
  const expirationTime = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
  
  for (const [id, lobby] of lobbies.entries()) {
    const timeSinceLastActivity = now.getTime() - lobby.lastActivity.getTime();
    if (timeSinceLastActivity > expirationTime) {
      lobbies.delete(id);
      lobbyCodeMap.delete(lobby.code);
    }
  }
}; 