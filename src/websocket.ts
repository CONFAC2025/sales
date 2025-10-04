import { FastifyInstance } from 'fastify';
import { WebSocketServer, WebSocket } from 'ws';
import jwt from 'jsonwebtoken';

interface JwtPayload {
  id: string;
  [key: string]: any;
}

const connections = new Map<string, WebSocket>();

export function initializeWebSocket(server: FastifyInstance) {
  const wss = new WebSocketServer({ server: server.server });

  wss.on('connection', (ws) => {
    ws.on('message', async (message: Buffer) => {
      try {
        const data = JSON.parse(message.toString());
        if (data.type === 'AUTH') {
          const token = data.payload;
          const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;
          connections.set(decoded.id, ws);
          console.log(`User ${decoded.id} connected via WebSocket.`);
        }
      } catch (err) {
        console.error('WebSocket auth error:', err);
        ws.close();
      }
    });

    ws.on('close', () => {
      const userId = [...connections.entries()].find(([_, sock]) => sock === ws)?.[0];
      if (userId) {
        connections.delete(userId);
        console.log(`User ${userId} disconnected.`);
      }
    });

    ws.on('error', (error) => {
        console.error('WebSocket error:', error);
    });
  });
}

export function sendToUser(userId: string, message: any) {
  const connection = connections.get(userId);
  if (connection && connection.readyState === WebSocket.OPEN) {
    try {
      connection.send(JSON.stringify(message));
      console.log(`Sent message to ${userId}:`, message.type);
      return true;
    } catch (e) {
      console.error(`Failed to send message to ${userId}`, e);
      return false;
    }
  }
  return false;
}
