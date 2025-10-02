import { FastifyInstance } from 'fastify';
import jwt from 'jsonwebtoken';

interface JwtPayload { id: string; [key: string]: any; }

const connections = new Map<string, any>();

export function startWebSocketServer(server: FastifyInstance) {
  server.get('/ws', { websocket: true }, (connection, req) => {
    // The connection object from fastify-websocket is the socket itself.
    const socket = connection;

    socket.on('data', async (message: Buffer) => {
      try {
        const data = JSON.parse(message.toString());
        if (data.type === 'AUTH') {
          const token = data.payload;
          const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;
          connections.set(decoded.id, socket);
          console.log(`User ${decoded.id} connected via WebSocket.`);
        }
      } catch (err) {
        console.error('WebSocket auth error:', err);
      }
    });

    socket.on('close', () => {
      const userId = [...connections.entries()].find(([_, sock]) => sock === socket)?.[0];
      if (userId) {
        connections.delete(userId);
        console.log(`User ${userId} disconnected.`);
      }
    });
  });
}

export function sendToUser(userId: string, message: any) {
  const connection = connections.get(userId);
  // The connection object is the socket itself, readyState is a property on it.
  if (connection && connection.readyState === 1) { // 1 means OPEN
    try {
        connection.send(JSON.stringify(message));
        console.log(`Sent message to ${userId}:`, message.type);
        return true;
    } catch(e) {
        console.error(`Failed to send message to ${userId}`, e);
        return false;
    }
  }
  return false;
}
