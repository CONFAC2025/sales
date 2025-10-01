import api from './api';

export interface ActivityLog {
  id: string;
  timestamp: string;
  userName: string;
  action: string;
  details: any;
}

export const getLogsForEntity = async (entityType: string, entityId: string): Promise<ActivityLog[]> => {
  const response = await api.get(`/logs/${entityType}/${entityId}`);
  return response.data.data;
};
