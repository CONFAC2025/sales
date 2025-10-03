import { FastifyInstance, FastifyRequest } from 'fastify';
import jwt from 'jsonwebtoken';

// Define a type for the query string for type safety
interface WebsocketRequest extends FastifyRequest {
  query: {
    token?: string;
  };
}

interface JwtPayload { id: string; [key: string]: any; }

// This map will store the actual WebSocket instances, keyed by userId
const connections = new Map<string, any>();

export function startWebSocketServer(server: FastifyInstance) {
  server.get('/ws', { websocket: true }, (connection, req: WebsocketRequest) => {
    // The actual WebSocket object is on the `socket` property of the connection
    const socket = connection.socket;

    const authenticateSocket = (token: string) => {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;
        connections.set(decoded.id, socket);
        console.log(`User ${decoded.id} connected via WebSocket.`);
        // Optional: Send a success message back to the client
        socket.send(JSON.stringify({ type: 'AUTH_SUCCESS' }));
      } catch (err) {
        console.error('WebSocket authentication error:', err);
        socket.send(JSON.stringify({ type: 'AUTH_FAILED' }));
        socket.close();
      }
    };

    // Attempt to authenticate from query string token first
    if (req.query.token) {
      authenticateSocket(req.query.token);
    }

    // The library uses the 'message' event, not 'data'
    socket.on('message', (message: Buffer) => {
      try {
        const data = JSON.parse(message.toString());
        // If the socket is not yet authenticated, look for an AUTH message
        if (data.type === 'AUTH') {
          authenticateSocket(data.payload);
        }
      } catch (err) {
        console.error('Error processing message:', err);
      }
    });

    socket.on('close', () => {
      // Find the user associated with this socket and remove them
      const userId = [...connections.entries()].find(([_, s]) => s === socket)?.[0];
      if (userId) {
        connections.delete(userId);
        console.log(`User ${userId} disconnected.`);
      }
    });

    socket.on('error', (error) => {
      console.error('WebSocket error:', error);
    });
  });
}

export function sendToUser(userId: string, message: any) {
  const socket = connections.get(userId);
  // Check if the socket exists and is in the OPEN state
  if (socket && socket.readyState === 1) { 
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