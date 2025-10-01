import { FastifyInstance, FastifyPluginOptions, FastifyRequest, FastifyReply } from 'fastify';
import { UserType, CustomerStatus, PotentialLevel, Customer, Prisma } from '@prisma/client'; // Added Customer and Prisma
import { authMiddleware } from '../middleware/auth';
import { CustomerService } from '../services/customerService';
import { prisma } from '../utils/prisma';

// Define the expected request body for creating a new customer
interface CreateCustomerBody {
  name: string;
  phone: string;
  status?: CustomerStatus;
  notes?: string;
  interestedProperty?: string;
  potential?: PotentialLevel;
  source?: string;
}
// Define the expected request body for updating an existing customer
interface UpdateCustomerBody extends Partial<CreateCustomerBody> {}


interface GetCustomersQuery {
  source?: string;
  potential?: PotentialLevel;
  status?: CustomerStatus;
  registeredByName?: string;
  registrationDateStart?: string; // Date string
  registrationDateEnd?: string;   // Date string
}

export default async function (fastify: FastifyInstance, opts: FastifyPluginOptions) {
  // All routes in this group require authentication
  fastify.addHook('preHandler', authMiddleware([
    UserType.ADMIN_STAFF, 
    UserType.MIDDLE_MANAGER,
    UserType.GENERAL_HQ_MANAGER,
    UserType.DEPARTMENT_MANAGER, 
    UserType.TEAM_LEADER, 
    UserType.SALES_STAFF,
    UserType.REAL_ESTATE,
    UserType.PARTNER_STAFF
  ]));

  // Create a new customer
  fastify.post('/', async (request: FastifyRequest<{ Body: CreateCustomerBody }>, reply: FastifyReply) => {
    try {
      const registeredById = request.user!.id;
      const { name, phone, status, notes, interestedProperty, potential, source } = request.body;

      // Explicitly construct the data object to ensure type safety
      const customerData: Prisma.CustomerCreateInput = {
        name,
        phone,
        status: status || 'REGISTERED', // Default if not provided
        notes,
        interestedProperty,
        potential: potential || null, // Nullable field
        source,
        registeredBy: {
          connect: { id: registeredById }
        }
      };

      const fullUser = await prisma.user.findUnique({ where: { id: request.user!.id } });
      if (!fullUser) {
        return reply.code(404).send({ success: false, message: '사용자를 찾을 수 없습니다.' });
      }

      const newCustomer = await CustomerService.createCustomer(customerData, fullUser);
      reply.code(201).send({ success: true, data: newCustomer, message: '고객이 성공적으로 등록되었습니다.' });
    } catch (error: any) {
      fastify.log.error(error, 'Error creating customer'); // Log the full error object
      const errorMessage = error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002'
        ? '이미 동일한 연락처로 등록된 고객이 존재합니다.'
        : error.message;
      reply.code(400).send({ success: false, message: errorMessage });
    }
  });

  // Get all customers (RBAC and filters applied)
  fastify.get('/', async (request: FastifyRequest<{ Querystring: GetCustomersQuery }>, reply: FastifyReply) => {
    try {
      const userPayload = request.user;
      if (!userPayload) {
        return reply.code(401).send({ success: false, message: '인증 정보가 없습니다.' });
      }

      const fullUser = await prisma.user.findUnique({ where: { id: userPayload.id } });
      if (!fullUser) {
        return reply.code(404).send({ success: false, message: '사용자를 찾을 수 없습니다.' });
      }

      const { source, potential, status, registeredByName, registrationDateStart, registrationDateEnd } = request.query;

      const filters = {
        source,
        potential: potential as PotentialLevel,
        status: status as CustomerStatus,
        registeredByName,
        registrationDateStart: registrationDateStart ? new Date(registrationDateStart) : undefined,
        registrationDateEnd: registrationDateEnd ? new Date(registrationDateEnd) : undefined,
      };

      const customers = await CustomerService.getCustomers(fullUser, { filters });
      reply.code(200).send({ success: true, data: customers });
    } catch (error: any) {
      fastify.log.error(error);
      reply.code(500).send({ success: false, message: '고객 목록을 불러오는 중 오류가 발생했습니다.' });
    }
  });

  // Get a single customer by ID
  fastify.get('/:id', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    try {
      const customer = await CustomerService.getCustomerById(request.params.id);
      if (!customer) {
        reply.code(404).send({ success: false, message: '고객을 찾을 수 없습니다.' });
        return;
      }
      reply.code(200).send({ success: true, data: customer });
    } catch (error: any) {
      fastify.log.error(error);
      reply.code(500).send({ success: false, message: '고객 정보를 불러오는 중 오류가 발생했습니다.' });
    }
  });

  // Update a customer
  fastify.put('/:id', async (request: FastifyRequest<{ Params: { id: string }, Body: UpdateCustomerBody }>, reply: FastifyReply) => {
    try {
      const fullUser = await prisma.user.findUnique({ where: { id: request.user!.id } });
      if (!fullUser) {
        return reply.code(404).send({ success: false, message: '사용자를 찾을 수 없습니다.' });
      }
      const updatedCustomer = await CustomerService.updateCustomer({
        where: { id: request.params.id },
        data: request.body,
        user: fullUser,
      });
      reply.code(200).send({ success: true, data: updatedCustomer, message: '고객 정보가 성공적으로 업데이트되었습니다.' });
    } catch (error: any) {
      fastify.log.error(error);
      reply.code(400).send({ success: false, message: error.message });
    }
  });

  // Delete a customer
  fastify.delete('/:id', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    try {
      await CustomerService.deleteCustomer({ id: request.params.id });
      reply.code(200).send({ success: true, message: '고객 정보가 성공적으로 삭제되었습니다.' });
    } catch (error: any) {
      fastify.log.error(error);
      reply.code(400).send({ success: false, message: error.message });
    }
  });
}