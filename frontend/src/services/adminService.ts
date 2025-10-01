import api from './api';
import type { UserStatus, UserType } from '@prisma/client';
import type { UserForAdminResponse, CreateUserPayload } from '../types/admin';

// Type for the response of getCustomersByRegistrant
export interface CustomerDetailsResponse {
  customers: any[]; // Define a proper customer type later
  stats: {
    byStatus: { status: string, count: number }[];
    bySource: { source: string | null, count: number }[];
  };
}

export const getUsersForAdmin = async (filters: any, sort?: { field: string, order: 'asc' | 'desc' }): Promise<UserForAdminResponse[]> => {
  try {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value) {
          params.append(key, String(value));
        }
      });
    }
    if (sort && sort.field && sort.order) {
      params.append('sortField', sort.field);
      params.append('sortOrder', sort.order);
    }
    const response = await api.get('/admin/users', { params });
    return response.data.data;
  } catch (error) {
    console.error('Failed to get users for admin', error);
    return [];
  }
};

export const createUser = async (userData: CreateUserPayload): Promise<UserForAdminResponse> => {
  const response = await api.post('/admin/users', userData);
  return response.data.data;
};

export const updateUserStatus = async (userId: string, status: UserStatus): Promise<UserForAdminResponse> => {
  const response = await api.put(`/admin/users/${userId}/status`, { status });
  return response.data.data;
};

export const getCustomersByRegistrant = async (userId: string): Promise<CustomerDetailsResponse> => {
  const response = await api.get(`/admin/users/${userId}/customers`);
  return response.data.data;
};

export const setUserManager = async (userId: string, managerId: string | null): Promise<UserForAdminResponse> => {
  const response = await api.put(`/admin/users/${userId}/set-manager`, { managerId });
  return response.data.data;
};

export const updateUserType = async (userId: string, userType: UserType): Promise<UserForAdminResponse> => {
  const response = await api.put(`/admin/users/${userId}/user-type`, { userType });
  return response.data.data;
};

export const assignOrg = async (userId: string, departmentId: string | null, teamId: string | null): Promise<UserForAdminResponse> => {
  const response = await api.put(`/admin/users/${userId}/assign-org`, { departmentId, teamId });
  return response.data.data;
};