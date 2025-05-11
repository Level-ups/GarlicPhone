import { UUID } from "crypto";
import { GameStore } from "../models/GameStore";
import { Lobby } from "../models/Lobby";
import { User } from "../models/User";

export function createLobby(owner: User, chainLength: number): Lobby {
  return GameStore.getInstance().createLobby(owner, chainLength);
}

export function getAllLobbies(): Lobby[] {
  return GameStore.getInstance().getAllLobbies();
}

export function getLobbyById(id: UUID): Lobby | undefined {
  return GameStore.getInstance().getLobby(id);
}

export function addPlayerToLobby(lobbyId: UUID, user: User): Lobby | undefined {
  return GameStore.getInstance().addPlayerToLobby(lobbyId, user);
}

export function updateLobbyPhase(lobbyCode: UUID): Lobby | undefined {
  return GameStore.getInstance().updateLobbyPhase(lobbyCode);
}

export function removePlayerFromLobby(lobbyId: UUID, user: User): Lobby | undefined {
  return GameStore.getInstance().removePlayerFromLobby(lobbyId, user);
}

export default {
  createLobby,
  getAllLobbies,
  getLobbyById,
  addPlayerToLobby,
  updateLobbyPhase,
  removePlayerFromLobby,
}