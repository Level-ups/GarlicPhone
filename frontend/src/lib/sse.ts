import type { Lobby, WithClient } from "../services/lobbyService";

export type SSEHandlers = (
  { [key: string]: (e: any) => void } &
  { "lobby_update": (e: WithClient<Lobby>) => void }
);

declare global {
  let sseHandler: EventSource | null;
}

export const sseHandlers: SSEHandlers = {
  "lobby_update": (data) => {
    console.log("RECEIVED EVENT:", data);

    if (!localStorage.getItem("gameId")) {
      localStorage.setItem("gameId", data.id);
    }

    if (!localStorage.getItem("playerId")) {
      localStorage.setItem("playerId", data.players[data.clientIndex].id);
    }

    switch(data.phases.phase) {
      // case "Waiting": break;
      case "Prompt":  visit("prompt");    break;
      case "Draw":    visit("draw");      break;
      case "Guess":   visit("guess");     break;
      case "Review":  visit("review");    break;
      case "Complete": () => {
        localStorage.removeItem("gameId");
        visit("menuPlay");
      } 
      break;
    }
    // visit("prompt");
  },
  "health": (data) => {
    console.log("HEALTH:", data);
  }
};

const STORAGE_KEY = 'sse_url';

export function updateSSEHandler(url?: string) {
  // TODO: Fix
  // if (url) {
  //   localStorage.setItem(STORAGE_KEY, url);
  // } else {
  //   url = localStorage.getItem(STORAGE_KEY) || undefined;
  // }

  if (!url) { return; throw new Error("No URL provided and none found in localStorage."); }

  (window as any).sseHandler = null; // Cleanup old event handler

  const source = new EventSource(`${window.location.origin}${url}`);

  for (const [event, handler] of Object.entries(sseHandlers)) {
    source.addEventListener(event, (e: MessageEvent) => {
      try {
        handler(JSON.parse(e.data));
      } catch (err) {
        console.error(`Error handling event '${event}':`, err);
      }
    });
  }

  source.onerror = (err) => {
    console.error("SSE connection error:", err);
  };

  (window as any).sseHandler = source; // expose globally
}

export function clearStoredSSEUrl() { localStorage.removeItem(STORAGE_KEY); }