import type { Request, Response } from 'express';

export type ServerSentEvent<T> = { event: string, data: T };

// Define a proper interface for the response writer with request property
export interface ServerSentEventResponseWriter<T> {
  (event: string, data: T): void;
  request?: Request;
}

export type ServerSentEventHandlerFunction<T> = (responseWriter: ServerSentEventResponseWriter<T>) => void

export const createServerSentEventHandler = <T>(handlerFunction: ServerSentEventHandlerFunction<T>): ((request: Request, response: Response) => void) => 
  (req: Request, res: Response) => {
    res.setHeader('Content-Type', 'text/event-stream')
    res.setHeader('Cache-Control', 'no-cache')
    res.setHeader('Connection', 'keep-alive')
    res.flushHeaders()

    // Create the response writer function
    const responseWriter: ServerSentEventResponseWriter<T> = (event: string, data: T): void => {
      const json = JSON.stringify(data)
      res.write(`event: ${event}\ndata: ${json}\n\n`);
    }

    // Attach the request to the responseWriter function for access in the handler
    responseWriter.request = req;

    handlerFunction(responseWriter);

    req.on('close', () => {
      res.end();
    });
  };
