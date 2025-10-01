import Fastify from 'fastify';
import cors from '@fastify/cors';
import websocket from '@fastify/websocket';
import multipart from '@fastify/multipart';
import staticPlugin from '@fastify/static';
import path from 'path';
import dotenv from 'dotenv';
import authRoutes from './routes/auth';
import adminRoutes from './routes/admin';
import customerRoutes from './routes/customerRoutes';
import organizationRoutes from './routes/organization';
import chatRoutes from './routes/chat';
import postsRoutes from './routes/posts';
import siteSettingsRoutes from './routes/siteSettings';
import notificationRoutes from './routes/notifications';
import resourceRoutes from './routes/resource';
import activityLogRoutes from './routes/activityLog';
import { startWebSocketServer } from './websocket';

dotenv.config();

const server = Fastify({
  logger: true,
});

server.register(cors, {
  origin: "https://sales-wine-mu.vercel.app",
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
});
server.register(websocket);
server.register(multipart, { limits: { fileSize: 10 * 1024 * 1024 } });
server.register(staticPlugin, {
  root: path.join(__dirname, '..', 'uploads'),
  prefix: '/uploads/',
});

startWebSocketServer(server);

server.register(authRoutes, { prefix: '/api/auth' });
server.register(adminRoutes, { prefix: '/api/admin' });
server.register(customerRoutes, { prefix: '/api/customers' });
server.register(organizationRoutes, { prefix: '/api/organization' });
server.register(chatRoutes, { prefix: '/api/chat' });
server.register(postsRoutes, { prefix: '/api/posts' });
server.register(siteSettingsRoutes, { prefix: '/api/site-settings' });
server.register(notificationRoutes, { prefix: '/api/notifications' });
server.register(resourceRoutes, { prefix: '/api/resources' });
server.register(activityLogRoutes, { prefix: '/api/logs' });

const start = async () => {
  try {
    const port = Number(process.env.PORT) || 3002;
    await server.listen({ port, host: '0.0.0.0' });
    console.log(`🚀 Server listening on port ${port}`);
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

start();
