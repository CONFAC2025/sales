import { UserStatus, UserType } from './prisma-enums';

export interface UserForAdminResponse {
  id: string;
  userId: string;
  name: string;
  phone: string;
  status: UserStatus;
  userType: UserType;
  departmentId?: string;
  teamId?: string;
  departmentName?: string;
  teamName?: string;
  registeredCustomersCount: number;
}

export interface CreateUserPayload {
  userId: string;
  email?: string;
  password?: string;
  name: string;
  phone: string;
  userType: UserType;
  departmentId?: string;
  teamId?: string;
}
