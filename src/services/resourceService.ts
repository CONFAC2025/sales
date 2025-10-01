import { prisma } from '../utils/prisma';
import { Prisma, User } from '@prisma/client';
import fs from 'fs/promises';
import path from 'path';

export class ResourceService {
  /**
   * Get all resources
   */
  public static async getResources() {
    return prisma.resource.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        author: { select: { name: true } },
      },
    });
  }

  /**
   * Create a new resource
   */
  public static async createResource(data: {
    title: string;
    description?: string;
    filePath: string;
    fileType: string;
    fileSize: number;
    authorId: string;
  }) {
    return prisma.resource.create({ data });
  }

  /**
   * Delete a resource
   */
  public static async deleteResource(id: string, user: User) {
    const resource = await prisma.resource.findUnique({
      where: { id },
    });

    if (!resource) {
      throw new Error('Resource not found.');
    }

    // Only admin can delete
    if (user.userType !== 'ADMIN_STAFF') {
      throw new Error('Permission denied.');
    }

    // Delete file from filesystem
    try {
      const filePath = path.join(__dirname, '..', '..', resource.filePath);
      await fs.unlink(filePath);
    } catch (error) {
      console.error(`Failed to delete file: ${resource.filePath}`, error);
      // We can decide whether to throw or just log this
    }

    // Delete from database
    return prisma.resource.delete({ where: { id } });
  }
}
