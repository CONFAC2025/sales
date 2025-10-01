import api from './api';
import type { User } from '../types/user';

interface LoginCredentials {
  userId: string;
  password: string;
}

interface LoginResponse {
  token: string;
  user: User;
}


export const login = async (credentials: LoginCredentials): Promise<LoginResponse> => {
  const response = await api.post('/auth/login', credentials);
  return response.data.data;
};

interface RegisterData {
  userId: string;
  password: string;
  name: string;
  phone: string;
  email: string;
  organizationRequest?: string;
}

export const register = async (data: RegisterData): Promise<User> => {
  const response = await api.post('/auth/register', data);
  return response.data.data;
};
