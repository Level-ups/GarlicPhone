export type SSEHandlers = Record<string, (e: any) => void>;

declare global {
  let sseHandler: EventSource | null;
}

export const sseHandlers: SSEHandlers = {
  "lobby_update": (data) => {
    console.log("RECEIVED EVENT:", data);
    // visit("prompt");
  },
  "health": (data) => {
    console.log("HEALTH:", data);
  }
};

const STORAGE_KEY = 'sse_url';

export function updateSSEHandler(url?: string) {
  if (url) {
    localStorage.setItem(STORAGE_KEY, url);
  } else {
    url = localStorage.getItem(STORAGE_KEY) || undefined;
  }

  if (!url) { throw new Error("No URL provided and none found in localStorage."); }

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