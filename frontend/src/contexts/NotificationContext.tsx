import React, { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';
import { useAuth } from './AuthContext';
import type { Notification } from '../types/notification';
import { getNotifications, pollNotifications } from '../services/notificationService';

// Simple event emitter for local events if needed, but not for websockets
class EventEmitter {
  private listeners: { [event: string]: Function[] } = {};
  subscribe(event: string, callback: Function) {
    this.listeners[event] = this.listeners[event] || [];
    this.listeners[event].push(callback);
  }
  unsubscribe(event: string, callback: Function) {
    if (this.listeners[event]) {
      this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
    }
  }
  dispatch(event: string, data: any) {
    if (this.listeners[event]) {
      this.listeners[event].forEach(cb => cb(data));
    }
  }
}
export const eventEmitter = new EventEmitter();

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  // These can be implemented later if needed
  markNotificationAsRead: (notificationId: string) => void;
  markAsReadByLink: (link: string) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider = ({ children }: { children: ReactNode }) => {
  const { isAuthenticated } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [latestDate, setLatestDate] = useState<string | undefined>(undefined);
  const isPolling = useRef(false);

  // Initial fetch of all notifications
  useEffect(() => {
    if (isAuthenticated) {
      getNotifications()
        .then(initialNotifications => {
          setNotifications(initialNotifications);
          if (initialNotifications.length > 0) {
            setLatestDate(initialNotifications[0].createdAt);
          }
        })
        .catch(console.error);
    }
  }, [isAuthenticated]);

  // Polling effect
  useEffect(() => {
    if (!isAuthenticated) return;

    const intervalId = setInterval(async () => {
      if (isPolling.current) return;
      isPolling.current = true;
      try {
        const newNotifications = await pollNotifications(latestDate);
        if (newNotifications.length > 0) {
          setNotifications(prev => [...newNotifications, ...prev]);
          setLatestDate(newNotifications[0].createdAt);
        }
      } catch (error) {
        console.error('Polling for notifications failed', error);
      } finally {
        isPolling.current = false;
      }
    }, 5000); // Poll every 5 seconds

    return () => clearInterval(intervalId);
  }, [isAuthenticated, latestDate]);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const markNotificationAsRead = (_notificationId: string) => {};
  const markAsReadByLink = (_link: string) => {};

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
