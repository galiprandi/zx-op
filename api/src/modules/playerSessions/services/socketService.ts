import { Server as SocketIOServer } from 'socket.io';

let io: SocketIOServer | null = null;

export function initializeSocketIO(server: any) {
  io = new SocketIOServer(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });
  
  console.log('Socket.IO initialized');
  return io;
}

export function getSocketIO() {
  if (!io) {
    throw new Error('Socket.IO not initialized. Call initializeSocketIO first.');
  }
  return io;
}

export function emitSessionEvent(event: 'session:play' | 'session:pause' | 'session:updated', data: any) {
  const socketIO = getSocketIO();
  socketIO.emit(event, data);
}

export function emitProductEvent(event: 'product:created' | 'product:updated' | 'product:deleted', data: any) {
  const socketIO = getSocketIO();
  socketIO.emit(event, data);
}

export function emitTransactionEvent(event: 'transaction:created', data: any) {
  const socketIO = getSocketIO();
  socketIO.emit(event, data);
}
