import { prisma } from '../utils/prisma';
import { Customer, Prisma, User, UserType, PotentialLevel, CustomerStatus } from '@prisma/client';
import { NotificationService } from './notificationService';
import { sendToUser } from '../websocket';
import { ActivityLogService, LogDetails } from './activityLogService';

export class CustomerService {
  /**
   * 고객 생성
   */
  public static async createCustomer(data: Prisma.CustomerCreateInput, creator: User): Promise<Customer> {
    const newCustomer = await prisma.customer.create({ data });

    // Log creation activity
    await ActivityLogService.createLog({
      userId: creator.id,
      userName: creator.name,
      action: 'CREATE',
      entityType: 'CUSTOMER',
      entityId: newCustomer.id,
      details: { message: `고객 ${newCustomer.name}을(를) 등록했습니다.` },
    });

    // Notify manager
    if (creator.managerId) {
      const notification = await NotificationService.createNotification({
        recipientId: creator.managerId,
        type: 'NEW_CUSTOMER',
        message: `${creator.name}님이 신규 고객 ${newCustomer.name}님을 등록했습니다.`,
        link: `/customers/${newCustomer.id}`,
      });
      sendToUser(creator.managerId, { type: 'NEW_NOTIFICATION', payload: notification });
    }

    const admins = await prisma.user.findMany({ where: { userType: { in: [UserType.ADMIN_STAFF, UserType.MIDDLE_MANAGER, UserType.GENERAL_HQ_MANAGER] } } });
    for (const admin of admins) {
      // Skip sending notification to the creator if they are an admin
      if (admin.id === creator.id) continue;

      const notification = await NotificationService.createNotification({
        recipientId: admin.id,
        type: 'NEW_CUSTOMER',
        message: `신규 고객 ${newCustomer.name}님이 등록되었습니다. (등록자: ${creator.name})`,
        link: `/customers/${newCustomer.id}/edit`,
      });
      sendToUser(admin.id, { type: 'NEW_NOTIFICATION', payload: notification });
    }

    return newCustomer;
  }

  /**
   * 고객 목록 조회 (RBAC 적용)
   */
  public static async getCustomers(user: User, params: {
    skip?: number;
    take?: number;
    cursor?: Prisma.CustomerWhereUniqueInput;
    where?: Prisma.CustomerWhereInput;
    orderBy?: Prisma.CustomerOrderByWithRelationInput;
    filters?: {
      source?: string;
      potential?: PotentialLevel;
      status?: CustomerStatus;
      registeredByName?: string;
      registrationDateStart?: Date;
      registrationDateEnd?: Date;
    };
  }): Promise<Customer[]> {
    const { skip, take, cursor, where: originalWhere, orderBy, filters } = params;
    
    const rbacWhere: Prisma.CustomerWhereInput = {};

    switch (user.userType) {
      case UserType.ADMIN_STAFF:
      case UserType.MIDDLE_MANAGER:
      case UserType.GENERAL_HQ_MANAGER:
        break;
      
      case UserType.DEPARTMENT_MANAGER:
        if (user.departmentId) {
          rbacWhere.registeredBy = {
            departmentId: user.departmentId,
          };
        } else {
          return [];
        }
        break;

      case UserType.TEAM_LEADER:
        if (user.teamId) {
          rbacWhere.registeredBy = {
            teamId: user.teamId,
          };
        } else {
          return [];
        }
        break;

      case UserType.SALES_STAFF:
      case UserType.REAL_ESTATE:
      case UserType.PARTNER_STAFF:
        rbacWhere.registeredById = user.id;
        break;

      default:
        return [];
    }

    const filtersWhere: Prisma.CustomerWhereInput = {};
    if (filters?.source) {
      filtersWhere.source = { contains: filters.source, mode: 'insensitive' };
    }
    if (filters?.potential) {
      filtersWhere.potential = filters.potential;
    }
    if (filters?.status) {
      filtersWhere.status = filters.status;
    }
    if (filters?.registeredByName) {
      filtersWhere.registeredBy = { name: { contains: filters.registeredByName, mode: 'insensitive' } };
    }
    if (filters?.registrationDateStart || filters?.registrationDateEnd) {
      filtersWhere.createdAt = {};
      if (filters.registrationDateStart) {
        (filtersWhere.createdAt as Prisma.DateTimeFilter).gte = filters.registrationDateStart;
      }
      if (filters.registrationDateEnd) {
        (filtersWhere.createdAt as Prisma.DateTimeFilter).lte = filters.registrationDateEnd;
      }
    }

    const combinedWhere = { ...originalWhere, ...rbacWhere, ...filtersWhere };

    return prisma.customer.findMany({ 
      skip, 
      take, 
      cursor, 
      where: combinedWhere, 
      orderBy: orderBy || { createdAt: 'desc' },
      include: {
        registeredBy: {
          select: {
            name: true,
          }
        }
      }
    });
  }

  /**
   * 특정 고객 조회
   */
  public static async getCustomerById(id: string): Promise<Customer | null> {
    return prisma.customer.findUnique({ where: { id } });
  }

  /**
   * 고객 정보 업데이트
   */
  public static async updateCustomer(params: {
    where: Prisma.CustomerWhereUniqueInput;
    data: Prisma.CustomerUpdateInput;
    user: User;
  }): Promise<Customer> {
    const { where, data, user } = params;

    const originalCustomer = await prisma.customer.findUnique({ where });
    if (!originalCustomer) {
      throw new Error('Customer not found.');
    }

    const updatedCustomer = await prisma.customer.update({
      where,
      data,
      include: { registeredBy: { include: { manager: true } } },
    });

    const changes: LogDetails[] = [];
    for (const key in data) {
      if (Object.prototype.hasOwnProperty.call(data, key)) {
        const oldValue = (originalCustomer as any)[key];
        const newValue = (data as any)[key];
        if (oldValue !== newValue) {
          changes.push({ field: key, from: oldValue, to: newValue });
        }
      }
    }

    if (changes.length > 0) {
      await ActivityLogService.createLog({
        userId: user.id,
        userName: user.name,
        action: 'UPDATE',
        entityType: 'CUSTOMER',
        entityId: updatedCustomer.id,
        details: changes,
      });
    }

    // If the status was updated, send notifications
    if (data.status && updatedCustomer.registeredBy) {
      const customerStatusToKorean = (status: CustomerStatus | string) => {
        switch (status) {
          case CustomerStatus.REGISTERED: return '등록';
          case CustomerStatus.VISITED: return '방문';
          case CustomerStatus.CONSULTED: return '상담';
          case CustomerStatus.CONTRACTED: return '계약';
          case CustomerStatus.CANCELLED: return '취소';
          default: return status;
        }
      };

      const admins = await prisma.user.findMany({ where: { userType: UserType.ADMIN_STAFF } });
      const registrant = updatedCustomer.registeredBy;

      const recipientIds = new Set<string>();
      recipientIds.add(registrant.id);
      if (registrant.managerId) {
        recipientIds.add(registrant.managerId);
      }
      admins.forEach(admin => recipientIds.add(admin.id));
      recipientIds.delete(user.id);

      const message = `${user.name}님이 고객 ${updatedCustomer.name}님의 상태를 '${customerStatusToKorean(data.status as CustomerStatus)}'(으)로 변경했습니다.`;

      for (const recipientId of recipientIds) {
        await NotificationService.createNotification({
          recipientId,
          type: 'CUSTOMER_STATUS_UPDATE',
          message,
          link: `/customers/${updatedCustomer.id}/edit`,
        }).then(notification => {
          sendToUser(recipientId, { type: 'NEW_NOTIFICATION', payload: notification });
        });
      }
    }

    return updatedCustomer;
  }

  /**
   * 고객 삭제
   */
  public static async deleteCustomer(where: Prisma.CustomerWhereUniqueInput): Promise<Customer> {
    return prisma.customer.delete({ where });
  }
}
