export type SSEHandlers = (
  { "update": (e: any) => void } |
  { "submission": (e: any) => void } |
  { "transition": (e: any) => void }
);

export function createSSESource(url: string, handlers: SSEHandlers) {
  const source = new EventSource(`${window.location.origin}${url}`);

  for (const [event, handler] of Object.entries(handlers)) {
    source.addEventListener(event, (e: MessageEvent) => {
      try {
        handler(JSON.parse(e.data));
      } catch (err) {
        error(`Error handling event '${event}':`, err);
      }
    });
  }

  source.onerror = (err) => { error("SSE connection error:", err); };

  return source;
}