import type { Server as HTTPServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';

type Logger = { info?: (msg: string) => void };

let io: SocketIOServer | null = null;

export function initializeSocketIO(server: HTTPServer, logger?: Logger) {
  io = new SocketIOServer(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });
  
  logger?.info?.('Socket.IO initialized');
  return io;
}

export function getSocketIO() {
  if (!io) {
    throw new Error('Socket.IO not initialized. Call initializeSocketIO first.');
  }
  return io;
}

export function emitSessionEvent(event: 'session:play' | 'session:pause' | 'session:updated', data: unknown) {
  const socketIO = getSocketIO();
  socketIO.emit(event, data);
}

export function emitProductEvent(event: 'product:created' | 'product:updated' | 'product:deleted', data: unknown) {
  const socketIO = getSocketIO();
  socketIO.emit(event, data);
}

export function emitTransactionEvent(event: 'transaction:created', data: unknown) {
  const socketIO = getSocketIO();
  socketIO.emit(event, data);
}

export function emitCartEvent(event: 'cart:updated', data: unknown) {
  const socketIO = getSocketIO();
  socketIO.emit(event, data);
}
