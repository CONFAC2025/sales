import { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';

import type { Notification } from '../types/notification';

// Dummy emitter for now
export const eventEmitter = {
  subscribe: (_event: string, _callback: (data: any) => void) => {},
  unsubscribe: (_event: string, _callback: (data: any) => void) => {},
};

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  markNotificationAsRead: (notificationId: string) => void;
  markAsReadByLink: (link: string) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider = ({ children }: { children: ReactNode }) => {
  const notifications: Notification[] = [];
  const unreadCount = 0;

  // Temporarily disabled WebSocket logic to isolate chat issues

  const markNotificationAsRead = async (_notificationId: string) => {};
  const markAsReadByLink = async (_link: string) => {};

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, markNotificationAsRead, markAsReadByLink }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};
