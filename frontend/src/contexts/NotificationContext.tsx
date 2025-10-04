import { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import type { ReactNode } from 'react';
import { useAuth } from './AuthContext';
import type { Notification } from '../types/notification';
import { getNotifications, markAsRead } from '../services/notificationService';

// Simple event emitter for local events
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
  markNotificationAsRead: (notificationId: string) => void;
  markAsReadByLink: (link: string) => void;
  markAsReadByLinkPrefix: (prefix: string) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider = ({ children }: { children: ReactNode }) => {
  const { isAuthenticated, token } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const ws = useRef<WebSocket | null>(null);

  const addNotification = useCallback((newNotification: Notification) => {
    setNotifications(prev => [
      newNotification, 
      ...prev.filter(n => n.id !== newNotification.id)
    ]);
    if (newNotification.type === 'NEW_CHAT_MESSAGE') {
      eventEmitter.dispatch('NEW_MESSAGE_FROM_NOTIFICATION', { 
        roomId: newNotification.link?.split('=')[1] 
      });
    }
  }, []);

  useEffect(() => {
    if (!isAuthenticated || !token) {
      if (ws.current) {
        ws.current.close();
        ws.current = null;
      }
      return;
    }

    const connect = () => {
      const wsUrl = `wss://sales-ofg0.onrender.com/ws?token=${token}`;
      ws.current = new WebSocket(wsUrl);

      ws.current.onopen = () => {
        console.log('WebSocket Connected');
        // Send auth message as required by the backend
        ws.current?.send(JSON.stringify({ type: 'AUTH', payload: token }));
      };

      ws.current.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          if (message.type === 'NEW_NOTIFICATION') {
            addNotification(message.payload as Notification);
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      ws.current.onerror = (error) => {
        console.error('WebSocket Error:', error);
      };

      ws.current.onclose = () => {
        console.log('WebSocket Disconnected. Reconnecting...');
        setTimeout(connect, 5000); // Reconnect after 5 seconds
      };
    };

    connect();

    // Initial fetch of past notifications
    getNotifications().then(setNotifications).catch(console.error);

    return () => {
      if (ws.current) {
        ws.current.onclose = null; // Prevent reconnect on manual close
        ws.current.close();
      }
    };
  }, [isAuthenticated, token, addNotification]);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const markNotificationAsRead = async (notificationId: string) => {
    const originalNotifications = notifications;
    setNotifications(prev => 
      prev.map(n => n.id === notificationId ? { ...n, isRead: true } : n)
    );
    try {
      await markAsRead(notificationId);
    } catch (error) {
      console.error('Failed to mark notification as read', error);
      setNotifications(originalNotifications); // Revert on error
    }
  };

  const markAsReadByLink = async (link: string) => {
    const notificationsToUpdate = notifications.filter(n => n.link === link && !n.isRead);
    if (notificationsToUpdate.length === 0) return;

    const originalNotifications = notifications;
    setNotifications(prev => 
      prev.map(n => n.link === link ? { ...n, isRead: true } : n)
    );

    try {
      await Promise.all(notificationsToUpdate.map(n => markAsRead(n.id)));
    } catch (error) {
      console.error('Failed to mark notifications by link as read', error);
      setNotifications(originalNotifications); // Revert on error
    }
  };

  const markAsReadByLinkPrefix = async (prefix: string) => {
    const notificationsToUpdate = notifications.filter(
      n => n.link?.startsWith(prefix) && !n.isRead
    );
    if (notificationsToUpdate.length === 0) return;

    const originalNotifications = notifications;
    setNotifications(prev => 
      prev.map(n => n.link?.startsWith(prefix) ? { ...n, isRead: true } : n)
    );

    try {
      await Promise.all(notificationsToUpdate.map(n => markAsRead(n.id)));
    } catch (error) {
      console.error('Failed to mark notifications by link prefix as read', error);
      setNotifications(originalNotifications); // Revert on error
    }
  };

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, markNotificationAsRead, markAsReadByLink, markAsReadByLinkPrefix }}>
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