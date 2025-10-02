import { FastifyInstance, FastifyPluginOptions, FastifyRequest, FastifyReply } from 'fastify';
import { UserType, UserStatus, Prisma } from '@prisma/client';
import { authMiddleware } from '../middleware/auth';
import { AdminService } from '../services/adminService';
import { prisma } from '../utils/prisma';

interface ApproveUserBody {
  userId: string;
}

interface CreateUserBody {
  userId: string;
  email?: string;
  password?: string;
  name: string;
  phone: string;
  userType: UserType;
  departmentId?: string;
  teamId?: string;
}

interface AdminUsersQuery {
  departmentId?: string;
  teamId?: string;
  status?: UserStatus;
  sortField?: string;
  sortOrder?: 'asc' | 'desc';
}

export default async function (fastify: FastifyInstance, opts: FastifyPluginOptions) {
  // 이 라우트 그룹의 모든 경로는 ADMIN_STAFF만 접근 가능
  fastify.addHook('preHandler', authMiddleware([UserType.ADMIN_STAFF, UserType.GENERAL_HQ_MANAGER]));

  // 사용자 승인 라우트
  fastify.post('/users/approve', async (request: FastifyRequest<{ Body: ApproveUserBody }>, reply: FastifyReply) => {
    try {
      const { userId } = request.body;
      const updatedUser = await AdminService.approveUser(userId);
      reply.code(200).send({ success: true, data: updatedUser, message: '사용자 계정이 승인되었습니다.' });
    } catch (error: any) {
      fastify.log.error(error);
      reply.code(400).send({ success: false, message: error.message });
    }
  });

  // Get all users for admin page
  fastify.get('/users', async (request: FastifyRequest<{ Querystring: AdminUsersQuery }>, reply: FastifyReply) => {
    try {
      const { departmentId, teamId, status, sortField, sortOrder } = request.query;
      const filters = { departmentId, teamId, status };
      const sort = sortField && sortOrder ? { field: sortField, order: sortOrder } : undefined;
      const users = await AdminService.getUsersForAdmin({ filters, sort });
      reply.code(200).send({ success: true, data: users });
    } catch (error: any) {
      fastify.log.error(error);
      reply.code(500).send({ success: false, message: '사용자 목록을 불러오는 중 오류가 발생했습니다.' });
    }
  });

  // Create a new user
  fastify.post('/users', async (request: FastifyRequest<{ Body: CreateUserBody }>, reply: FastifyReply) => {
    try {
      const newUser = await AdminService.createUser(request.body as Prisma.UserCreateInput);
      const { password, ...userResponse } = newUser;
      reply.code(201).send({ success: true, data: userResponse });
    } catch (error: any) {
      fastify.log.error(error);
      reply.code(400).send({ success: false, message: error.message });
    }
  });

  // Update a user's status
  fastify.put('/users/:id/status', async (request: FastifyRequest<{ Params: { id: string }, Body: { status: UserStatus } }>, reply: FastifyReply) => {
    try {
      const { id } = request.params;
      const { status } = request.body;
      const actor = await prisma.user.findUnique({ where: { id: request.user!.id } });
      if (!actor) return reply.code(404).send({ message: 'Actor not found' });
      const updatedUser = await AdminService.updateUserStatus(id, status, actor);
      const { password, ...userResponse } = updatedUser;
      reply.code(200).send({ success: true, data: userResponse });
    } catch (error: any) {
      fastify.log.error(error);
      reply.code(400).send({ success: false, message: error.message });
    }
  });

  // Get customers by registrant
  fastify.get('/users/:id/customers', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    try {
      const { id } = request.params;
      const data = await AdminService.getCustomersByRegistrant(id);
      reply.code(200).send({ success: true, data });
    } catch (error: any) {
      fastify.log.error(error);
      reply.code(500).send({ success: false, message: '고객 정보를 불러오는 중 오류가 발생했습니다.' });
    }
  });

  // Set user's manager
  fastify.put('/users/:id/set-manager', async (request: FastifyRequest<{ Params: { id: string }, Body: { managerId: string | null } }>, reply: FastifyReply) => {
    try {
      const { id } = request.params;
      const { managerId } = request.body;
      const actor = await prisma.user.findUnique({ where: { id: request.user!.id } });
      if (!actor) return reply.code(404).send({ message: 'Actor not found' });
      const updatedUser = await AdminService.setManager(id, managerId, actor);
      const { password, ...userResponse } = updatedUser;
      reply.code(200).send({ success: true, data: userResponse });
    } catch (error: any) {
      fastify.log.error(error);
      reply.code(400).send({ success: false, message: error.message });
    }
  });

  // Update user's userType
  fastify.put('/users/:id/user-type', async (request: FastifyRequest<{ Params: { id: string }, Body: { userType: UserType } }>, reply: FastifyReply) => {
    try {
      const { id } = request.params;
      const { userType } = request.body;
      const actor = await prisma.user.findUnique({ where: { id: request.user!.id } });
      if (!actor) return reply.code(404).send({ message: 'Actor not found' });
      const updatedUser = await AdminService.updateUserType(id, userType, actor);
      const { password, ...userResponse } = updatedUser;
      reply.code(200).send({ success: true, data: userResponse });
    } catch (error: any) {
      fastify.log.error(error);
      reply.code(400).send({ success: false, message: error.message });
    }
  });

  // Assign user to org
  fastify.put('/users/:id/assign-org', async (request: FastifyRequest<{ Params: { id: string }, Body: { departmentId: string | null, teamId: string | null } }>, reply) => {
    try {
      const { id } = request.params;
      const { departmentId, teamId } = request.body;
      const actor = await prisma.user.findUnique({ where: { id: request.user!.id } });
      if (!actor) return reply.code(404).send({ message: 'Actor not found' });
      const updatedUser = await AdminService.assignOrg(id, departmentId, teamId, actor);
      const { password, ...userResponse } = updatedUser;
      reply.code(200).send({ success: true, data: userResponse });
    } catch (error: any) {
      fastify.log.error(error);
      reply.code(500).send({ success: false, message: '사용자 조직 배정에 실패했습니다.' });
    }
  });
}
