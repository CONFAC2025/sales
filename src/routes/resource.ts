import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { UserType } from '@prisma/client';
import { authMiddleware } from '../middleware/auth';
import { ResourceService } from '../services/resourceService';
import { prisma } from '../utils/prisma';
import fs from 'fs';
import util from 'util';
import path from 'path';

const pipeline = util.promisify(require('stream').pipeline);

export default async function (fastify: FastifyInstance, opts: FastifyPluginOptions) {
  // Middleware to ensure user is authenticated for all resource routes
  fastify.addHook('preHandler', authMiddleware());

  // GET all resources (for all authenticated users)
  fastify.get('/', async (request, reply) => {
    const resources = await ResourceService.getResources();
    reply.send({ success: true, data: resources });
  });

  // POST a new resource (admin only)
  fastify.post('/', { preHandler: authMiddleware([UserType.ADMIN_STAFF]) }, async (request, reply) => {
    const parts = request.parts();
    const data: { [key: string]: any } = {};
    let filePath = '';
    let fileType = '';
    let fileSize = 0;

    for await (const part of parts) {
      if (part.type === 'file') {
        const uniqueFilename = `${Date.now()}-${part.filename}`;
        const uploadPath = path.join(__dirname, '..', '..', 'uploads', uniqueFilename);
        const writeStream = fs.createWriteStream(uploadPath);
        await pipeline(part.file, writeStream);
        
        filePath = `/uploads/${uniqueFilename}`;
        fileType = part.mimetype;
        // Get file size
        const stats = await fs.promises.stat(uploadPath);
        fileSize = stats.size;

      } else {
        data[part.fieldname] = part.value;
      }
    }

    if (!filePath) {
      return reply.code(400).send({ success: false, message: 'File is required.' });
    }

    const resource = await ResourceService.createResource({
      title: data.title,
      description: data.description,
      filePath,
      fileType,
      fileSize,
      authorId: request.user!.id,
    });

    reply.code(201).send({ success: true, data: resource });
  });

  // DELETE a resource (admin only)
  fastify.delete('/:id', { preHandler: authMiddleware([UserType.ADMIN_STAFF]) }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const actor = await prisma.user.findUnique({ where: { id: request.user!.id } });
    if (!actor) return reply.code(404).send({ message: 'Actor not found' });
    await ResourceService.deleteResource(id, actor);
    reply.send({ success: true, message: 'Resource deleted successfully.' });
  });
}
