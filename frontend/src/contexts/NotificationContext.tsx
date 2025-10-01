import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getNotifications, markAsRead } from '../services/notificationService';
import type { Notification } from '../types/notification';

// Dummy emitter for now
export const eventEmitter = {
  subscribe: () => {},
  unsubscribe: () => {},
};

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  markNotificationAsRead: (notificationId: string) => void;
  markAsReadByLink: (link: string) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider = ({ children }: { children: ReactNode }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Temporarily disabled WebSocket logic to isolate chat issues

  const markNotificationAsRead = async (notificationId: string) => {};
  const markAsReadByLink = async (link: string) => {};

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
