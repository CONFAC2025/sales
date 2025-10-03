import { FastifyInstance, FastifyRequest } from 'fastify';
import jwt from 'jsonwebtoken';
import { SocketStream } from '@fastify/websocket';

interface JwtPayload { id: string; [key: string]: any; }

const connections = new Map<string, any>();

export function startWebSocketServer(server: FastifyInstance) {
  server.get('/ws', { websocket: true }, (connection: SocketStream, req: FastifyRequest) => {
    const { socket } = connection;

    const authenticateSocket = (token: string) => {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;
        connections.set(decoded.id, socket);
        console.log(`User ${decoded.id} connected via WebSocket.`);
        socket.send(JSON.stringify({ type: 'AUTH_SUCCESS' }));
      } catch (err) {
        console.error('WebSocket authentication error:', err);
        socket.send(JSON.stringify({ type: 'AUTH_FAILED' }));
        socket.close();
      }
    };

    try {
      const url = new URL(req.url, `http://${req.headers.host}`);
      const tokenFromQuery = url.searchParams.get('token');
      if (tokenFromQuery) {
        authenticateSocket(tokenFromQuery);
      }
    } catch (e) {
      console.error('Could not parse token from URL', e);
    }

    socket.on('message', (message: Buffer) => {
      try {
        const data = JSON.parse(message.toString());
        if (data.type === 'AUTH') {
          authenticateSocket(data.payload);
        }
      } catch (err) {
        console.error('Error processing message:', err);
      }
    });

    socket.on('close', () => {
      const userId = [...connections.entries()].find(([_, s]) => s === socket)?.[0];
      if (userId) {
        connections.delete(userId);
        console.log(`User ${userId} disconnected.`);
      }
    });

    socket.on('error', (error: Error) => {
      console.error('WebSocket error:', error);
    });
  });
}

export function sendToUser(userId: string, message: any) {
  const socket = connections.get(userId);
  if (socket && socket.readyState === 1) { // 1 is WebSocket.OPEN
    try {
        socket.send(JSON.stringify(message));
        console.log(`Sent message to ${userId}:`, message.type);
        return true;
    } catch(e) {
        console.error(`Failed to send message to ${userId}`, e);
        return false;
    }
  }
  return false;
}