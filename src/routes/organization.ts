import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { UserType } from '@prisma/client';
import { authMiddleware } from '../middleware/auth';
import { OrganizationService } from '../services/organizationService';

export default async function (fastify: FastifyInstance, opts: FastifyPluginOptions) {
  // All routes in this group are for admins only
  fastify.addHook('preHandler', authMiddleware([UserType.ADMIN_STAFF]));

  // --- Department Routes ---
  fastify.get('/departments', async (request, reply) => {
    const departments = await OrganizationService.getDepartments();
    reply.send({ success: true, data: departments });
  });

  fastify.post('/departments', async (request, reply) => {
    const newDepartment = await OrganizationService.createDepartment(request.body as any);
    reply.code(201).send({ success: true, data: newDepartment });
  });

  // --- Team Routes ---
  fastify.get('/teams', async (request, reply) => {
    const teams = await OrganizationService.getTeams();
    reply.send({ success: true, data: teams });
  });

  fastify.post('/teams', async (request, reply) => {
    const newTeam = await OrganizationService.createTeam(request.body as any);
    reply.code(201).send({ success: true, data: newTeam });
  });

  // --- Organization Tree ---
  fastify.get('/tree', async (request, reply) => {
    const tree = await OrganizationService.getOrganizationTree();
    reply.send({ success: true, data: tree });
  });
}
