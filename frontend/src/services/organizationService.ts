import api from './api';
import type { User } from '../types/user';

// Basic types, can be expanded later
export type Department = {
  id: string;
  name: string;
  code: string;
  _count?: { users: number; teams: number };
}

export type Team = {
  id: string;
  name: string;
  departmentId: string;
  department?: Department;
  _count?: { users: number };
}


// == Department API calls ==
export const getDepartments = async (): Promise<Department[]> => {
  const response = await api.get('/organization/departments');
  return response.data.data;
};

export const createDepartment = async (data: { name: string; code: string; description?: string }): Promise<Department> => {
  const response = await api.post('/organization/departments', data);
  return response.data.data;
};

// == Team API calls ==
export const getTeams = async (): Promise<Team[]> => {
  const response = await api.get('/organization/teams');
  return response.data.data;
};

export const createTeam = async (data: { name: string; departmentId: string; description?: string }): Promise<Team> => {
  const response = await api.post('/organization/teams', data);
  return response.data.data;
};

// == Organization Tree API calls ==
export const getOrganizationTree = async (): Promise<{ departments: Department[], teams: Team[], users: User[] }> => {
  const response = await api.get('/organization/tree');
  return response.data.data;
};
