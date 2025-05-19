import { Server as IOServer, Socket } from "socket.io";

type ClientId = string | number;

export type AddClientResult = "success" | "replacedPrevious";
export type DispatchAlertResult = "success" | "invalidClientId";

// Manage WebSocket client connections & dispatch events using Socket.IO
export class SockCoordinator<EventType = string> {
  private clients: { [key: ClientId]: Socket } = {};
  private io: IOServer;

  constructor(io: IOServer) {
    this.io = io;

    // Register connection listener
    this.io.on("connection", (socket: Socket) => {
      console.log("> CONNECTION:", socket.handshake.query.clientId);
      const clientId = socket.handshake.query.clientId as ClientId;
      // socket.handshake.query.clientId
      if (clientId == null) {
        console.log("> MISSING CLIENT ID ON CONNECTION");
        socket.disconnect(true);
        return;
      }

      const addResult = this.addClient(clientId, socket);
      if (addResult == "replacedPrevious") {
        console.log("> REPLACE EXISTING CONNECTION:", clientId);
      }
    });
  }

  public addClient(clientId: ClientId, socket: Socket): AddClientResult {
    console.log("ADDING CLIENT:", clientId);
    let res: AddClientResult = "success";

    // Replace old connection
    if (clientId in this.clients) {
      this.clients[clientId].disconnect(true);
      delete this.clients[clientId];
      res = "replacedPrevious";
    }

    // Connect & notify
    this.clients[clientId] = socket;
    socket.emit("connected", clientId);

    // Cleanup on disconnect
    socket.on("disconnect", () => { this.removeClient(clientId); });

    return res;
  }

  public removeClient(clientId: ClientId): void {
    console.log("REMOVING CLIENT:", clientId);
    const socket = this.clients[clientId];
    if (socket) {
      socket.disconnect(true);
      delete this.clients[clientId];
    }
  }

  // Dispatch event to specific client
  public dispatch(clientId: ClientId, data: any, event: EventType): DispatchAlertResult {
    console.log(`DISPATCH [${event}]:`, clientId, "\n ->", data)
    const socket = this.clients[clientId];
    if (!socket) {
      console.log("INVALID CLIENT ID:", clientId);
      console.log("CLIENT IDS:", Object.keys(this.clients));
      return "invalidClientId";
    }
    socket.emit(event as string, data);
    return "success";
  }

  // Broadcast to all listed clients
  public broadcast(clients: ClientId[], data: any, event: EventType): void {
    console.log(`--- BROADCAST [${event}] ---`);
    clients.forEach((c) => {
      if (c in this.clients) {
        this.dispatch(c, data, event);
      }
    });
  }
}
