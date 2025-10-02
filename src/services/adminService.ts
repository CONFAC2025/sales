import { prisma } from '../utils/prisma';
import { User, UserStatus, UserType, Prisma } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { NotificationService } from './notificationService';
import { ActivityLogService, LogDetails } from './activityLogService';
import { sendToUser } from '../websocket';

export class AdminService {
  /**
   * 사용자 계정 승인
   */
  public static async approveUser(userId: string): Promise<User> {
    const user = await prisma.user.findUnique({
      where: { userId },
    });

    if (!user) {
      throw new Error('사용자를 찾을 수 없습니다.');
    }

    if (user.status !== UserStatus.PENDING) {
      throw new Error('이미 처리된 요청입니다.');
    }

    return prisma.user.update({
      where: { userId },
      data: { status: UserStatus.APPROVED },
    });
  }

  /**
   * Get all users with their organization and customer count for admin page
   */
  public static async getUsersForAdmin(options: {
    filters?: {
      departmentId?: string;
      teamId?: string;
      status?: UserStatus;
    };
    sort?: {
      field: string;
      order: 'asc' | 'desc';
    };
  } = {}) {
    const { filters = {}, sort } = options;
    const where: Prisma.UserWhereInput = {};
    if (filters.departmentId) where.departmentId = filters.departmentId;
    if (filters.teamId) where.teamId = filters.teamId;
    if (filters.status) where.status = filters.status;

    let orderBy: Prisma.UserOrderByWithRelationInput = { createdAt: 'desc' }; // Default sort
    if (sort && sort.field) {
      if (sort.field === 'customerCount') {
        orderBy = { registeredCustomers: { _count: sort.order } };
      } else if (sort.field === 'department') {
        orderBy = { department: { name: sort.order } };
      } else if (sort.field === 'team') {
        orderBy = { team: { name: sort.order } };
      } else {
        orderBy = { [sort.field]: sort.order };
      }
    }

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        userId: true,
        name: true,
        phone: true,
        status: true,
        userType: true,
        departmentId: true,
        teamId: true,
        department: {
          select: {
            name: true,
          },
        },
        team: {
          select: {
            name: true,
          },
        },
        _count: {
          select: {
            registeredCustomers: true,
          },
        },
      },
      orderBy,
    });

    return users.map(user => ({
      ...user,
      departmentName: user.department?.name,
      teamName: user.team?.name,
      registeredCustomersCount: user._count.registeredCustomers,
    }));
  }

  /**
   * Create a new user
   */
  public static async createUser(data: Prisma.UserCreateInput): Promise<User> {
    const passwordToHash = (data.password && data.password.length > 0) ? data.password : '1234';
    const hashedPassword = await bcrypt.hash(passwordToHash, 10);

    // Determine organizationLevel based on userType
    let organizationLevel: number;
    switch (data.userType) {
      case UserType.ADMIN_STAFF:
        organizationLevel = 1;
        break;
      case UserType.MIDDLE_MANAGER:
        organizationLevel = 2;
        break;
      case UserType.GENERAL_HQ_MANAGER:
        organizationLevel = 3;
        break;
      case UserType.DEPARTMENT_MANAGER:
        organizationLevel = 4;
        break;
      case UserType.TEAM_LEADER:
        organizationLevel = 5;
        break;
      case UserType.SALES_STAFF:
      case UserType.REAL_ESTATE:
      case UserType.PARTNER_STAFF:
        organizationLevel = 6;
        break;
      default:
        throw new Error('Invalid user type');
    }

    const newUser = await prisma.user.create({
      data: {
        ...data,
        password: hashedPassword,
        organizationLevel: organizationLevel,
      },
    });

    // TODO: This should be done by the person creating the user, not hardcoded.
    const creator = await prisma.user.findFirst({ where: { userType: 'ADMIN_STAFF' } });

    // Log creation activity
    if (creator) {
      await ActivityLogService.createLog({
        userId: creator.id,
        userName: creator.name,
        action: 'CREATE',
        entityType: 'USER',
        entityId: newUser.id,
        details: { message: `사용자 ${newUser.name}을(를) 생성했습니다.` },
      });
    }

    // Notify admins
    const admins = await prisma.user.findMany({ where: { userType: 'ADMIN_STAFF' } });
    for (const admin of admins) {
      const notification = await NotificationService.createNotification({
        recipientId: admin.id,
        type: 'NEW_USER',
        message: `새로운 사용자 ${newUser.name}님이 가입했습니다.`,
        link: `/admin/users`,
      });
      sendToUser(admin.id, { type: 'NEW_NOTIFICATION', payload: notification });
    }

    return newUser;
  }

  /**
   * Update a user's status
   */
  public static async updateUserStatus(userId: string, status: UserStatus, actor: User): Promise<User> {
    const originalUser = await prisma.user.findUnique({ where: { id: userId } });
    if (!originalUser) throw new Error('User not found');

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { status },
    });

    // Log activity
    await ActivityLogService.createLog({
      userId: actor.id,
      userName: actor.name,
      action: 'UPDATE',
      entityType: 'USER',
      entityId: updatedUser.id,
      details: { field: 'status', from: originalUser.status, to: updatedUser.status },
    });

    const userStatusToKorean = (status: UserStatus) => {
      switch (status) {
        case UserStatus.APPROVED:
          return '승인';
        case UserStatus.PENDING:
          return '대기';
        case UserStatus.REJECTED:
          return '거부';
        case UserStatus.SUSPENDED:
          return '정지';
        default:
          return status;
      }
    };

    // Notify user
    const notification = await NotificationService.createNotification({
      recipientId: userId,
      type: 'USER_STATUS_UPDATE',
      message: `회원님의 계정 상태가 '${userStatusToKorean(status)}'으로 변경되었습니다.`,
      link: `/admin/users`,
    });
    sendToUser(userId, { type: 'NEW_NOTIFICATION', payload: notification });

    return updatedUser;
  }

  /**
   * Get customers and stats for a specific registrant (user)
   */
  public static async getCustomersByRegistrant(userId: string) {
    const customers = await prisma.customer.findMany({
      where: {
        registeredById: userId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const statsByStatus = await prisma.customer.groupBy({
      by: ['status'],
      where: {
        registeredById: userId,
      },
      _count: {
        status: true,
      },
    });

    const statsBySource = await prisma.customer.groupBy({
      by: ['source'],
      where: {
        registeredById: userId,
      },
      _count: {
        source: true,
      },
    });

    return {
      customers,
      stats: {
        byStatus: statsByStatus.map(item => ({ status: item.status, count: item._count.status })),
        bySource: statsBySource.map(item => ({ source: item.source, count: item._count.source })),
      }
    };
  }

  /**
   * Set a user's manager
   */
  public static async setManager(userId: string, managerId: string | null, actor: User): Promise<User> {
    const originalUser = await prisma.user.findUnique({ where: { id: userId } });
    if (!originalUser) throw new Error('User not found');

    // TODO: Add validation to prevent cycles and ensure manager has a higher organizationLevel.
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { managerId },
    });

    // Log activity
    if (originalUser.managerId !== updatedUser.managerId) {
      await ActivityLogService.createLog({
        userId: actor.id,
        userName: actor.name,
        action: 'UPDATE',
        entityType: 'USER',
        entityId: updatedUser.id,
        details: { field: 'managerId', from: originalUser.managerId, to: updatedUser.managerId },
      });
    }

    return updatedUser;
  }

  /**
   * Update a user's userType and organizationLevel
   */
  public static async updateUserType(userId: string, userType: UserType, actor: User): Promise<User> {
    const originalUser = await prisma.user.findUnique({ where: { id: userId } });
    if (!originalUser) throw new Error('User not found');

    let organizationLevel: number;
    switch (userType) {
      case UserType.ADMIN_STAFF: organizationLevel = 1; break;
      case UserType.MIDDLE_MANAGER: organizationLevel = 2; break;
      case UserType.GENERAL_HQ_MANAGER: organizationLevel = 3; break;
      case UserType.DEPARTMENT_MANAGER: organizationLevel = 4; break;
      case UserType.TEAM_LEADER: organizationLevel = 5; break;
      case UserType.SALES_STAFF: case UserType.REAL_ESTATE: case UserType.PARTNER_STAFF: organizationLevel = 6; break;
      default: throw new Error('Invalid user type');
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { userType, organizationLevel },
    });

    // Log activity
    await ActivityLogService.createLog({
      userId: actor.id,
      userName: actor.name,
      action: 'UPDATE',
      entityType: 'USER',
      entityId: updatedUser.id,
      details: { field: 'userType', from: originalUser.userType, to: updatedUser.userType },
    });

    return updatedUser;
  }

  /**
   * Assign user to a department and team
   */
  public static async assignOrg(userId: string, departmentId: string | null, teamId: string | null, actor: User): Promise<User> {
    const originalUser = await prisma.user.findUnique({ where: { id: userId } });
    if (!originalUser) throw new Error('User not found');

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        departmentId: departmentId,
        teamId: teamId,
      },
    });

    const changes: LogDetails[] = [];
    if (originalUser.departmentId !== updatedUser.departmentId) {
      changes.push({ field: 'departmentId', from: originalUser.departmentId, to: updatedUser.departmentId });
    }
    if (originalUser.teamId !== updatedUser.teamId) {
      changes.push({ field: 'teamId', from: originalUser.teamId, to: updatedUser.teamId });
    }

    if (changes.length > 0) {
      await ActivityLogService.createLog({
        userId: actor.id,
        userName: actor.name,
        action: 'UPDATE',
        entityType: 'USER',
        entityId: updatedUser.id,
        details: changes,
      });

      // Notify the user whose organization was changed
      const notification = await NotificationService.createNotification({
        recipientId: updatedUser.id,
        type: 'USER_PROFILE_UPDATE',
        message: `관리자에 의해 회원님의 소속이 변경되었습니다.`,
        link: '/my-page',
      });
      sendToUser(updatedUser.id, { type: 'NEW_NOTIFICATION', payload: notification });
    }

    return updatedUser;
  }
}
