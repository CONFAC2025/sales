import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { authMiddleware } from '../middleware/auth';
import { ActivityLogService, LogEntityType } from '../services/activityLogService';

export default async function (fastify: FastifyInstance, opts: FastifyPluginOptions) {
  // All routes require authentication
  fastify.addHook('preHandler', authMiddleware());

  fastify.get('/:entityType/:entityId', async (request, reply) => {
    const { entityType, entityId } = request.params as { entityType: string, entityId: string };

    try {
      const logs = await ActivityLogService.getLogsForEntity(entityType.toUpperCase() as LogEntityType, entityId);
      reply.send({ success: true, data: logs });
    } catch (error) {
      console.error(`Failed to get logs for ${entityType}:${entityId}`, error);
      reply.code(500).send({ success: false, message: 'Failed to retrieve activity logs.' });
    }
  });
}
