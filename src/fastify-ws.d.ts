import 'fastify';
import { Server } from 'ws';

declare module 'fastify' {
  interface FastifyInstance {
    ws: Server;
  }
}
