import { prisma } from '../utils/prisma';
import { Department, Team, Prisma, User } from '@prisma/client';

export class OrganizationService {
  // ========= Department Methods =========

  public static async getDepartments(): Promise<Department[]> {
    return prisma.department.findMany({ include: { _count: { select: { users: true, teams: true } } } });
  }

  public static async createDepartment(data: Prisma.DepartmentCreateInput): Promise<Department> {
    return prisma.department.create({ data });
  }

  // ========= Team Methods =========

  public static async getTeams(): Promise<Team[]> {
    return prisma.team.findMany({ include: { department: true, _count: { select: { users: true } } } });
  }

  public static async createTeam(data: Prisma.TeamCreateInput): Promise<Team> {
    return prisma.team.create({ data });
  }

  // ========= Organization Tree =========

  public static async getOrganizationTree(): Promise<{ departments: any[], teams: any[], users: any[] }> {
    const departments = await prisma.department.findMany();
    const teams = await prisma.team.findMany();
    const users = await prisma.user.findMany({
      include: {
        _count: {
          select: {
            registeredCustomers: true,
          },
        },
      },
    });

    return { departments, teams, users };
  }
}
