import { FastifyInstance, FastifyPluginOptions, FastifyRequest } from 'fastify';
import { UserType } from '@prisma/client';
import { authMiddleware } from '../middleware/auth';
import { SiteSettingsService } from '../services/siteSettingsService';
import fs from 'fs';
import util from 'util';
import path from 'path';

const pipeline = util.promisify(require('stream').pipeline);

export default async function (fastify: FastifyInstance, opts: FastifyPluginOptions) {
  // GET route is public for anyone to see site settings
  fastify.get('/', async (request, reply) => {
    const settings = await SiteSettingsService.getSiteSettings();
    reply.send({ success: true, data: settings });
  });

  // PUT route is protected for admins to update settings
  fastify.put('/', { preHandler: authMiddleware([UserType.ADMIN_STAFF]) }, async (request, reply) => {
    const data: any = {};
    const parts = request.parts();

    for await (const part of parts) {
      if (part.type === 'file') {
        const uniqueFilename = `${Date.now()}-${part.filename}`;
        const uploadPath = path.join(__dirname, '..', '..', 'uploads', uniqueFilename);
        await pipeline(part.file, fs.createWriteStream(uploadPath));
        data[part.fieldname] = `/uploads/${uniqueFilename}`;
      } else {
        data[part.fieldname] = part.value;
      }
    }

    const updatedSettings = await SiteSettingsService.updateSiteSettings(data);
    reply.send({ success: true, data: updatedSettings });
  });
}
