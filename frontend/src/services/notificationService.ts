import api from './api';
import type { Notification } from '../types/notification';

export const getNotifications = async (): Promise<Notification[]> => {
  const response = await api.get('/notifications');
  return response.data.data;
};

export const markAsRead = async (notificationId: string): Promise<Notification> => {
  const response = await api.put(`/notifications/${notificationId}/read`);
  return response.data.data;
};

export const markAllAsRead = async (): Promise<void> => {
  await api.put('/notifications/read-all');
};
