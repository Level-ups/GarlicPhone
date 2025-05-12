import { UUID } from "crypto";
import { Lobby } from "./Lobby";
import { User } from "./User";

export class GameStore {
  private lobbies: Lobby[] = [];
  static instance: GameStore | undefined;
  
  private constructor() {
    // Singleton
  }

  static getInstance(): GameStore {
    if (!GameStore.instance) {
      GameStore.instance = new GameStore();
      return GameStore.instance;
    } else {
      return GameStore.instance;
    }
  }

  createLobby(owner: User, chainLength: number): Lobby {
    const lobby = new Lobby(owner, chainLength);
    this.lobbies.push(lobby);
    return lobby;
  }
  
  getLobby(code: UUID): Lobby | undefined {
    return this.lobbies.find((lobby) => lobby.code === code);
  }

  getAllLobbies(): Lobby[] {
    return this.lobbies;
  }

  addPlayerToLobby(lobbyCode: UUID, user: User): Lobby | undefined {
    const lobby = this.getLobby(lobbyCode);
    if (lobby) {
      lobby.addPlayer(user);
      return lobby;
    } else {
      return undefined;
    }
  }

  updateLobbyPhase(lobbyCode: UUID): Lobby | undefined {
    const lobby = this.getLobby(lobbyCode);
    if (lobby) {
      lobby.progressPhase();
      return lobby;
    } else {
      return undefined;
    }
  }

  removePlayerFromLobby(lobbyCode: UUID, user: User): Lobby | undefined {
    const lobby = this.getLobby(lobbyCode);
    if (lobby) {
      lobby.removePlayer(user);
      return lobby;
    } else {
      return undefined;
    }
  }
}