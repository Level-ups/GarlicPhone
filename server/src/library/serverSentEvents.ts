import express from 'express';

export type ServerSentEvent<T> = {
  event: string,
  data: T
};

// Define a proper interface for the response writer with request property
export interface ServerSentEventResponseWriter<T> {
  (event: string, data: T): void;
  request?: express.Request;
}

export type ServerSentEventHandlerFunction<T> = (responseWriter: ServerSentEventResponseWriter<T>) => void

export const createServerSentEventHandler = <T>(handlerFunction: ServerSentEventHandlerFunction<T>): (request: express.Request, response: express.Response) => void => 
  (request: express.Request, response: express.Response) => {
    response.setHeader('Content-Type', 'text/event-stream')
    response.setHeader('Cache-Control', 'no-cache')
    response.setHeader('Connection', 'keep-alive')
    response.flushHeaders()

    // Create the response writer function
    const responseWriter: ServerSentEventResponseWriter<T> = (event: string, data: T): void => {
      const json = JSON.stringify(data)
      response.write(`event: ${event}\ndata: ${json}\n\n`);
    }

    // Attach the request to the responseWriter function for access in the handler
    responseWriter.request = request;

    handlerFunction(responseWriter);

    request.on('close', () => {
      response.end();
    });
  };
