import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { UserType } from '@prisma/client';
import { authMiddleware } from '../middleware/auth';
import { ChatService } from '../services/chatService';
import { prisma } from '../utils/prisma';
import fs from 'fs';
import util from 'util';
import path from 'path';

const pipeline = util.promisify(require('stream').pipeline);

export default async function (fastify: FastifyInstance, opts: FastifyPluginOptions) {

  // HTTP routes for chat
  fastify.register(async function(fastify) {
    fastify.addHook('preHandler', authMiddleware([
      UserType.ADMIN_STAFF, 
      UserType.DEPARTMENT_MANAGER, 
      UserType.TEAM_LEADER, 
      UserType.SALES_STAFF,
      UserType.REAL_ESTATE,
      UserType.PARTNER_STAFF,
      UserType.GENERAL_HQ_MANAGER
    ]));

    fastify.get('/subordinates', async (request, reply) => {
      const userPayload = request.user!;
      const fullUser = await prisma.user.findUnique({ where: { id: userPayload.id } });
      if (!fullUser) return reply.code(404).send({ message: 'User not found' });
      const subordinates = await ChatService.getSubordinates(fullUser);
      reply.send({ success: true, data: subordinates });
    });

    fastify.get('/targets', async (request, reply) => {
      const userPayload = request.user!;
      const fullUser = await prisma.user.findUnique({ where: { id: userPayload.id } });
      if (!fullUser) return reply.code(404).send({ message: 'User not found' });
      const targets = await ChatService.getChatTargets(fullUser);
      reply.send({ success: true, data: targets });
    });

    fastify.post('/rooms', async (request, reply) => {
      const userPayload = request.user!;
      const { name, memberIds } = request.body as { name: string, memberIds: string[] };
      const canCreate = ['ADMIN_STAFF', 'DEPARTMENT_MANAGER', 'TEAM_LEADER'].includes(userPayload.userType);
      if (!canCreate) return reply.code(403).send({ message: 'Permission denied.' });
      const newRoom = await ChatService.createChatRoom(userPayload.id, memberIds, name);
      reply.code(201).send({ success: true, data: newRoom });
    });

    // Find or create a one-on-one chat
    fastify.post('/one-on-one', async (request, reply) => {
      const userPayload = request.user!;
      const { targetUserId } = request.body as { targetUserId: string };
      const room = await ChatService.findOrCreateOneOnOneChat(userPayload.id, targetUserId);
      reply.send({ success: true, data: room });
    });

    fastify.get('/rooms', async (request, reply) => {
      const userPayload = request.user!;
      const rooms = await ChatService.getChatRoomsForUser(userPayload.id);
      reply.send({ success: true, data: rooms });
    });

    fastify.get('/rooms/:id/messages', async (request, reply) => {
      const { id } = request.params as { id: string };
      const messages = await ChatService.getMessagesForRoom(id);
      reply.send({ success: true, data: messages });
    });

    // Delete a chat room
    fastify.delete('/rooms/:id', async (request, reply) => {
      const userPayload = request.user!;
      const { id } = request.params as { id: string };
      await ChatService.deleteChatRoom(id, userPayload.id);
      reply.send({ success: true, message: 'Chat room deleted successfully.' });
    });

    // Delete a message
    fastify.delete('/messages/:id', async (request, reply) => {
      const userPayload = request.user!;
      const { id } = request.params as { id: string };
      await ChatService.deleteMessage(id, userPayload.id);
      reply.send({ success: true, message: 'Message deleted successfully.' });
    });

    // File Upload
    fastify.post('/upload', async (request, reply) => {
      const data = await request.file();
      if (!data) {
        return reply.code(400).send({ message: 'No file uploaded.' });
      }
      const uniqueFilename = `${Date.now()}-${data.filename}`;
      const uploadPath = path.join(__dirname, '..', '..', 'uploads', uniqueFilename);
      await pipeline(data.file, fs.createWriteStream(uploadPath));
      
      const fileUrl = `/uploads/${uniqueFilename}`;
      reply.send({ success: true, data: { url: fileUrl, type: data.mimetype, name: data.filename } });
    });

    fastify.post('/messages', async (request, reply) => {
      const userPayload = request.user!;
      const { roomId, content, fileUrl, fileType } = request.body as { roomId: string, content: string, fileUrl?: string, fileType?: string };
      const message = await ChatService.saveMessage(roomId, userPayload.id, content, fileUrl, fileType);
      reply.code(201).send({ success: true, data: message });
    });
  });
}
