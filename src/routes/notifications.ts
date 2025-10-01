import { FastifyInstance, FastifyPluginOptions, FastifyRequest } from 'fastify';
import { UserType } from '@prisma/client';
import { authMiddleware } from '../middleware/auth';
import { NotificationService } from '../services/notificationService';

export default async function (fastify: FastifyInstance, opts: FastifyPluginOptions) {
  fastify.addHook('preHandler', authMiddleware([UserType.ADMIN_STAFF, UserType.MIDDLE_MANAGER, UserType.GENERAL_HQ_MANAGER, UserType.DEPARTMENT_MANAGER, UserType.TEAM_LEADER, UserType.SALES_STAFF, UserType.REAL_ESTATE, UserType.PARTNER_STAFF]));

  fastify.get('/', async (request: FastifyRequest, reply) => {
    const user = request.user!;
    const notifications = await NotificationService.getNotificationsForUser(user.id);
    reply.send({ success: true, data: notifications });
  });

  fastify.put('/:id/read', async (request: FastifyRequest<{ Params: { id: string } }>, reply) => {
    const { id } = request.params;
    const notification = await NotificationService.markAsRead(id);
    reply.send({ success: true, data: notification });
  });

  fastify.put('/read-all', async (request: FastifyRequest, reply) => {
    const user = request.user!;
    await NotificationService.markAllAsRead(user.id);
    reply.send({ success: true });
  });
}
