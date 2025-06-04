import { ServerSentEvent } from "../library/serverSentEvents";

export type LobbyUpdate = {
  lobbyId: string,
  players: string[]
};

export class LobbyUpdateEvent implements ServerSentEvent<undefined> {
  event: string;
  data: undefined;

  constructor(event: string) {
    this.event = event;
  }
}