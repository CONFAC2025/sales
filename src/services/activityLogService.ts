import { prisma } from '../utils/prisma';
import { Prisma } from '@prisma/client';

export type LogAction = 'CREATE' | 'UPDATE' | 'DELETE';
export type LogEntityType = 'CUSTOMER' | 'USER' | 'POST' | 'COMMENT' | 'RESOURCE';

export interface LogDetails {
  field?: string;
  from?: any;
  to?: any;
  message?: string;
}

export class ActivityLogService {
  /**
   * Create a new activity log entry
   */
  public static async createLog(data: {
    userId: string;
    userName: string;
    action: LogAction;
    entityType: LogEntityType;
    entityId: string;
    details: LogDetails | LogDetails[];
  }) {
    const detailsJson = data.details as Prisma.InputJsonValue;
    return prisma.activityLog.create({
      data: {
        userId: data.userId,
        userName: data.userName,
        action: data.action,
        entityType: data.entityType,
        entityId: data.entityId,
        details: detailsJson,
      },
    });
  }

  /**
   * Get logs for a specific entity
   */
  public static async getLogsForEntity(entityType: LogEntityType, entityId: string) {
    return prisma.activityLog.findMany({
      where: {
        entityType,
        entityId,
      },
      orderBy: {
        timestamp: 'desc',
      },
    });
  }
}
