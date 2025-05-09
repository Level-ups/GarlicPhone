import express from 'express';

export type ServerSentEvent<T> = {
  event: string,
  data: T
};

export type ServerSentEventResponseWriter<T> = (event: string, data: T) => void

export type ServerSentEventHandlerFunction<T> = (responseWriter: ServerSentEventResponseWriter<T>) => void

export const createServerSentEventHandler = <T>(handlerFunction: ServerSentEventHandlerFunction<T>): (request: express.Request, response: express.Response) => void => 
  (request: express.Request, response: express.Response) => {
    response.setHeader('Content-Type', 'text/event-stream')
    response.setHeader('Cache-Control', 'no-cache')
    response.setHeader('Connection', 'keep-alive')
    response.flushHeaders()

    const responseWriter = (event: string, data: T) => {
      const json = JSON.stringify(data)
      response.write(`event: ${event}\ndata: ${json}\n\n`);
    }

    handlerFunction(responseWriter);

    request.on('close', () => {
      response.end();
    });
  };
