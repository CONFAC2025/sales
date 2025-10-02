import { prisma } from '../utils/prisma';
import { Notification, Prisma } from '@prisma/client';

export class NotificationService {
  public static async createNotification(data: Prisma.NotificationUncheckedCreateInput): Promise<Notification> {
    return prisma.notification.create({ data });
  }

  public static async getNotificationsForUser(userId: string): Promise<Notification[]> {
    return prisma.notification.findMany({
      where: { recipientId: userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  public static async markAsRead(notificationId: string): Promise<Notification> {
    return prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true },
    });
  }

  public static async markAllAsRead(userId: string): Promise<Prisma.BatchPayload> {
    return prisma.notification.updateMany({
      where: { recipientId: userId, isRead: false },
      data: { isRead: true },
    });
  }

  public static async getNewNotificationsForUser(userId: string, since?: string): Promise<Notification[]> {
    const where: Prisma.NotificationWhereInput = {
      recipientId: userId,
    };
    if (since) {
      where.createdAt = {
        gt: new Date(since),
      };
    }
    return prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }
}
