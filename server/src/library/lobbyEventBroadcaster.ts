import { Lobby } from '../models/Lobby';
import { ServerSentEventResponseWriter } from './serverSentEvents';

// Store client connections by lobby ID
interface LobbyClient {
  sendEvent: ServerSentEventResponseWriter<any>;
  lastActivity: Date;
}

// Map of lobby ID to array of client connections
const lobbyClients: Map<string, LobbyClient[]> = new Map();


//Register a new client connection for a specific lobby
export function registerClient(lobbyId: string, sendEvent: ServerSentEventResponseWriter<any>): void {
  if (!lobbyClients.has(lobbyId)) {
    lobbyClients.set(lobbyId, []);
  }
  
  const clients = lobbyClients.get(lobbyId) as LobbyClient[];
  clients.push({
    sendEvent,
    lastActivity: new Date()
  });
}


// Remove a client connection from a specific lobby 
export function removeClient(lobbyId: string, sendEvent: ServerSentEventResponseWriter<any>): void {
  if (!lobbyClients.has(lobbyId)) {
    return;
  }
  
  let clients = lobbyClients.get(lobbyId) as LobbyClient[];
  clients = clients.filter(client => client.sendEvent !== sendEvent);
  
  if (clients.length === 0) {
    lobbyClients.delete(lobbyId);
  } else {
    lobbyClients.set(lobbyId, clients);
  }
}


// Broadcast a lobby update to all connected clients for that lobby 
export function broadcastLobbyUpdate(lobby: Lobby, eventName: string = "lobby_update"): void {
  const { id: lobbyId } = lobby;
  
  if (!lobbyClients.has(lobbyId)) {
    return;
  }
  
  const clients = lobbyClients.get(lobbyId) as LobbyClient[];
  
  let i = 0;
  for (const client of clients) {
    try {
      const assignments = lobby.phasePlayerAssignments.filter(x => (
        lobby.phases.getCurrentPhase().index == x.phase.index &&
        lobby.players[i].id == x.player.id
      ));

      console.log("\n\n")
      console.log("ASSIGNMENTS BEFORE:", assignments);
      console.log("ASSIGNMENTS AFTER:", assignments);
      console.log("-------------------------------------\n\n")

      const payload = {
        ...lobby,
        phasePlayerAssignments: assignments,
        clientIndex: i
      };

      client.sendEvent(eventName, payload);

      client.lastActivity = new Date();
    } catch (error) {
      console.error(`Error broadcasting to client:`, error);
    }
    i++;
  }
}


// Send a player-specific event to a specific player in a lobby 
export function sendPlayerEvent(lobbyId: string, playerId: string, eventType: string, data: any): void {
  if (!lobbyClients.has(lobbyId)) {
    return;
  }
  
  const clients = lobbyClients.get(lobbyId) as LobbyClient[];
  
  for (const client of clients) {
    try {
      client.sendEvent(`player_${eventType}`, {
        playerId,
        ...data
      });
      client.lastActivity = new Date();
    } catch (error) {
      console.error(`Error sending player event:`, error);
    }
  }
}


// Clean up inactive clients
export function cleanupInactiveClients(): void {
  const now = new Date();
  const maxInactivity = 15 * 60 * 1000; // 15 minutes
  
  for (const [lobbyId, clients] of lobbyClients.entries()) {
    const activeClients = clients.filter(client => {
      const inactiveTime = now.getTime() - client.lastActivity.getTime();
      return inactiveTime < maxInactivity;
    });
    
    if (activeClients.length === 0) {
      lobbyClients.delete(lobbyId);
    } else if (activeClients.length !== clients.length) {
      lobbyClients.set(lobbyId, activeClients);
    }
  }
} 