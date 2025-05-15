// Types matching the backend models
export interface Player {
  id: string;
  name: string;
  avatarUrl: string;
  isHost: boolean;
  isReady: boolean;
}

export type LobbyStatus = 'waiting' | 'started' | 'finished';
export type GamePhaseName = "Waiting" | "Prompt" | "Draw" | "Guess" | "Review" | "Complete";

export type WithClient<T> = T & { clientIndex: number };

export interface Lobby {
  id: string;
  code: string;
  players: Player[];
  maxPlayers: number;
  status: LobbyStatus;
  createdAt: string;
  phases: { index: number, phase: GamePhaseName };
  lastActivity: string;
}

// API base URL - adjust this based on your environment
const API_BASE_URL = 'http://localhost:5000/api';

/**
 * Create a new lobby
 */
export async function createLobby(hostId: string, hostName: string, hostAvatarUrl: string = '', maxPlayers: number = 10): Promise<Lobby> {
  const response = await fetch(`${API_BASE_URL}/lobbies`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      hostId,
      hostName,
      hostAvatarUrl,
      maxPlayers
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to create lobby');
  }

  return await response.json();
}

/**
 * Join a lobby using a code
 */
export async function joinLobbyByCode(code: string, playerId: string, playerName: string, playerAvatarUrl: string = ''): Promise<Lobby> {
  const response = await fetch(`${API_BASE_URL}/lobbies/join`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      code,
      playerId,
      playerName,
      playerAvatarUrl
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to join lobby');
  }

  return await response.json();
}

/**
 * Leave a lobby
 */
export async function leaveLobby(lobbyId: string, playerId: string): Promise<Lobby> {
  const response = await fetch(`${API_BASE_URL}/lobbies/${lobbyId}/leave`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      playerId
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to leave lobby');
  }

  return await response.json();
}

/**
 * Set player ready status
 */
export async function setPlayerReady(lobbyId: string, playerId: string, isReady: boolean): Promise<Lobby> {
  const response = await fetch(`${API_BASE_URL}/lobbies/${lobbyId}/ready`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      playerId,
      isReady
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to update ready status');
  }

  return await response.json();
}

/**
 * Start the game (host only)
 */
export async function startGame(lobbyId: string, playerId: string): Promise<Lobby> {
  const response = await fetch(`${API_BASE_URL}/lobbies/${lobbyId}/start`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      playerId
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to start game');
  }

  return await response.json();
}

/**
 * Get lobby by ID
 */
export async function getLobbyById(lobbyId: string): Promise<Lobby> {
  const response = await fetch(`${API_BASE_URL}/lobbies/${lobbyId}`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to get lobby');
  }

  return await response.json();
}

/**
 * Get lobby by code
 */
export async function getLobbyByCode(code: string): Promise<Lobby> {
  const response = await fetch(`${API_BASE_URL}/lobbies/code/${code}`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to get lobby');
  }

  return await response.json();
}

/**
 * Create and return an EventSource for real-time lobby updates
 */
export function connectToLobbyEvents(lobbyId: string, callbacks: {
  onLobbyState?: (lobby: Lobby) => void;
  onLobbyUpdate?: (lobby: Lobby) => void;
  onPlayerEvent?: (data: any) => void;
  onError?: (error: any) => void;
}): EventSource {
  const eventSource = new EventSource(`${API_BASE_URL}/lobbies/${lobbyId}/events`);
  
  // Initial lobby state
  eventSource.addEventListener('lobby_state', (event) => {
    const data = JSON.parse(event.data);
    if (callbacks.onLobbyState) {
      callbacks.onLobbyState(data);
    }
  });
  
  // Lobby updates
  eventSource.addEventListener('lobby_update', (event) => {
    const data = JSON.parse(event.data);
    if (callbacks.onLobbyUpdate) {
      callbacks.onLobbyUpdate(data);
    }
  });
  
  // Player-specific events (optional)
  eventSource.addEventListener('player_event', (event) => {
    const data = JSON.parse(event.data);
    if (callbacks.onPlayerEvent) {
      callbacks.onPlayerEvent(data);
    }
  });
  
  // Error handling
  eventSource.addEventListener('error', (event) => {
    if (callbacks.onError) {
      callbacks.onError(event);
    }
  });
  
  return eventSource;
} 