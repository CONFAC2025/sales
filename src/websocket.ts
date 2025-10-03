import { FastifyInstance, FastifyRequest } from 'fastify';

export function startWebSocketServer(server: FastifyInstance) {
  server.get('/ws', { websocket: true }, (connection: any, req: FastifyRequest) => {
    console.log('--- DEBUGGING WEBSOCKET CONNECTION ---');
    console.log('Logging the raw connection object:');
    // We try to serialize it to see its structure. If it has circular refs, it might fail.
    try {
      console.log(JSON.stringify(connection, null, 2));
    } catch (e) {
      console.log('Could not stringify connection object.');
    }

    console.log('Logging the keys of the connection object:');
    try {
      console.log(Object.keys(connection));
    } catch (e) {
      console.log('Could not get keys of connection object.');
    }
    console.log('--- END DEBUGGING ---');

    // Close the connection immediately after logging to prevent further errors
    // and to show the client that the connection is not stable.
    if (connection.socket && typeof connection.socket.close === 'function') {
        connection.socket.close();
    } else if (typeof connection.close === 'function') {
        connection.close();
    }
  });
}

// Empty sendToUser function to prevent other errors during this debug phase.
export function sendToUser(userId: string, message: any) {
  console.log(`[No-Op] Attempted to send message to ${userId}`);
  return;
}