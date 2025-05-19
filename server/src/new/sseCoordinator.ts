import express, { Request, Response } from 'express';

type ClientId = string | number;

export type AddClientResult = "success" | "alreadyAdded";

// Manage SSE client connections & dispatch events
export class SSECoordinator<EventType = string> {
  private clients: { [key: ClientId]: Response } = {};

  // TODO: Add heartbeat

  public addClient(clientId: ClientId, res: Response): AddClientResult {
    if (clientId in this.clients) return "alreadyAdded";
    
    res.setHeader('Content-Type', 'text/event-stream')
    res.setHeader('Cache-Control', 'no-cache')
    res.setHeader('Connection', 'keep-alive')
    res.flushHeaders()

    // Set SSE headers
    // res.writeHead(200, {
    //   'Content-Type':     'text/event-stream',
    //   'Cache-Control':    'no-cache',
    //   'Connection':       'keep-alive',
    // });
    // Send initial event to confirm connection
    res.write(`event: connected\ndata: ${clientId}\n\n`);

    this.clients[clientId] = res;

    // Cleanup on client disconnect
    res.on('close', () => { this.removeClient(clientId); res.end(); });

    return "success";
  }

  public removeClient(clientId: ClientId): void {
    const res = this.clients[clientId];
    if (res) {
      res.end();
      delete this.clients[clientId];
    }
  }

  // Dispatch event to specific client
  public dispatch(clientId: ClientId, data: any, event: EventType): void {
    const res = this.clients[clientId];
    if (!res) {
      throw new Error(`Client with ID ${clientId} not found`);
    }

    const payload = typeof data === 'string' ? data : JSON.stringify(data);
    res.write(`event: ${event}\ndata: ${payload}\n\n`);
  }

  // Broadcast to all listed clients
  public broadcast(clients: ClientId[], data: any, event: EventType): void {
    clients.forEach(c => {
      if (c in this.clients) { this.dispatch(c, data, event); }
    })
  }
}