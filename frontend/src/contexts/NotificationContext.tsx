import React, { createContext, useContext, useEffect, useRef, useCallback } from 'react';
import type { ReactNode } from 'react';
import { useAuth } from './AuthContext';
import type { Notification } from '../types/notification';

// 1. Real Event Emitter
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

// 2. Context Type Definition
interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  markNotificationAsRead: (notificationId: string) => void;
  markAsReadByLink: (link: string) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

// 3. Provider with WebSocket Logic
export const NotificationProvider = ({ children }: { children: ReactNode }) => {
  const { isAuthenticated, token } = useAuth();
  const [notifications, setNotifications] = React.useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = React.useState(0);
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<number | null>(null);

  const addNotification = useCallback((newNotification: Notification) => {
    setNotifications(prev => [newNotification, ...prev.slice(0, 99)]); // Keep last 100
    if (!newNotification.isRead) {
      setUnreadCount(prev => prev + 1);
    }
  }, []);

  useEffect(() => {
    // Subscribe to events dispatched from WebSocket
    eventEmitter.subscribe('NEW_NOTIFICATION', addNotification);
    return () => {
      eventEmitter.unsubscribe('NEW_NOTIFICATION', addNotification);
    };
  }, [addNotification]);

  useEffect(() => {
    if (isAuthenticated && token) {
      connect();
    } else {
      disconnect();
    }

    return () => {
      disconnect();
    };
  }, [isAuthenticated, token]);

  const connect = () => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      return;
    }

    const wsUrl = 'wss://sales-ofg0.onrender.com/ws';
    const socket = new WebSocket(wsUrl);
    socketRef.current = socket;

    socket.onopen = () => {
      console.log('WebSocket connected');
      // Send auth token
      socket.send(JSON.stringify({ type: 'AUTH', payload: token }));
      // Reset reconnect timer on successful connection
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
    };

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('WebSocket message received:', data);
        // Dispatch the event globally
        eventEmitter.dispatch(data.type, data.payload);
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error);
      }
    };

    socket.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    socket.onclose = () => {
      console.log('WebSocket disconnected. Attempting to reconnect...');
      // Simple reconnect logic with a 5-second delay
      if (!reconnectTimeoutRef.current) {
        reconnectTimeoutRef.current = setTimeout(() => {
          connect();
          reconnectTimeoutRef.current = null;
        }, 5000);
      }
    };
  };

  const disconnect = () => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    if (socketRef.current) {
      socketRef.current.close();
      socketRef.current = null;
    }
  };

  // Dummy implementations for now, can be built out later
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