import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import type { ReactNode } from 'react';

import { useAuth } from './AuthContext';
import type { ChatRoom, ChatMessage } from '../types/chat';
import { getMyChatRooms, getMessagesForRoom, findOrCreateOneOnOneChat, deleteChatRoom as apiDeleteChatRoom, deleteMessage as apiDeleteMessage, sendMessage as apiSendMessage } from '../services/chatService';
import toast from 'react-hot-toast';
import { useLocation } from 'react-router-dom';
import { eventEmitter } from './NotificationContext';

interface ChatContextType {
  rooms: ChatRoom[];
  messages: { [roomId: string]: ChatMessage[] };
  sendMessage: (roomId: string, content: string, file?: File) => void;
  openRoom: (roomId: string) => void;
  closeRoom: (roomId: string) => void;
  openRoomIds: string[];
  startOneOnOneChat: (targetUserId: string) => Promise<void>;
  sendSystemMessageToUser: (targetUserId: string, message: string) => Promise<void>;
  getRoomDisplayName: (room: ChatRoom) => string;
  deleteRoom: (roomId: string) => Promise<boolean>;
  totalUnreadCount: number;
  unreadCounts: { [roomId: string]: number };
  addRoom: (newRoom: ChatRoom) => void;
  deleteMessage: (messageId: string) => Promise<void>;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider = ({ children }: { children: ReactNode }) => {
  const { user: currentUser, isAuthenticated } = useAuth();
  const location = useLocation();
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [messages, setMessages] = useState<{ [roomId: string]: ChatMessage[] }>({});
  const [openRoomIds, setOpenRoomIds] = useState<string[]>([]);
  const [unreadCounts, setUnreadCounts] = useState<{ [roomId: string]: number }>({});

  // --- Callback Functions with useCallback --- //
  const addRoom = useCallback((newRoom: ChatRoom) => {
    setRooms(prev => (prev.find(r => r.id === newRoom.id) ? prev : [newRoom, ...prev]));
  }, []);

  const removeRoom = useCallback((roomId: string) => {
    setRooms(prev => prev.filter(r => r.id !== roomId));
    setMessages(prev => { const { [roomId]: _, ...rest } = prev; return rest; });
    setOpenRoomIds(prev => prev.filter(id => id !== roomId));
    setUnreadCounts(prev => { const { [roomId]: _, ...rest } = prev; return rest; });
  }, []);

  const addMessage = useCallback((newMessage: ChatMessage) => {
    setMessages(prev => ({ ...prev, [newMessage.roomId]: [...(prev[newMessage.roomId] || []), newMessage] }));
    if (location.pathname !== '/chat' || !openRoomIds.includes(newMessage.roomId)) {
      setUnreadCounts(prev => ({ ...prev, [newMessage.roomId]: (prev[newMessage.roomId] || 0) + 1 }));
    }
  }, [location.pathname, openRoomIds]);

  // --- Refs to hold the latest callbacks --- //
  const addMessageRef = useRef(addMessage);
  const addRoomRef = useRef(addRoom);
  const removeRoomRef = useRef(removeRoom);
  useEffect(() => {
    addMessageRef.current = addMessage;
    addRoomRef.current = addRoom;
    removeRoomRef.current = removeRoom;
  }, [addMessage, addRoom, removeRoom]);

  // --- Main Effect for WebSocket and Data Fetching --- //
  useEffect(() => {
    if (isAuthenticated) {
      getMyChatRooms().then(setRooms).catch(console.error);

      const handleNewRoom = (data: ChatRoom) => addRoomRef.current(data);
      const handleRoomDeleted = (data: { roomId: string }) => removeRoomRef.current(data.roomId);
      const handleNewMessageFromNotification = ({ roomId }: { roomId: string }) => {
        if (roomId) {
          getMessagesForRoom(roomId)
            .then(fetchedMessages => setMessages(prev => ({ ...prev, [roomId]: fetchedMessages })))
            .catch(console.error);
        }
      };

      eventEmitter.subscribe('NEW_MESSAGE_FROM_NOTIFICATION', handleNewMessageFromNotification);
      eventEmitter.subscribe('NEW_CHAT_ROOM', handleNewRoom);
      eventEmitter.subscribe('CHAT_ROOM_DELETED', handleRoomDeleted);

      return () => {
        eventEmitter.unsubscribe('NEW_MESSAGE_FROM_NOTIFICATION', handleNewMessageFromNotification);
        eventEmitter.unsubscribe('NEW_CHAT_ROOM', handleNewRoom);
        eventEmitter.unsubscribe('CHAT_ROOM_DELETED', handleRoomDeleted);
      };
    } else {
      setRooms([]);
      setMessages({});
      setOpenRoomIds([]);
      setUnreadCounts({});
    }
  }, [isAuthenticated]); // This effect ONLY runs on auth change

  const sendMessage = async (roomId: string, content: string, file?: File) => {
    try {
      const newMessage = await apiSendMessage(roomId, content, file);
      addMessage(newMessage);
    } catch (error) {
      toast.error('메시지 전송에 실패했습니다.');
    }
  };

  const openRoom = (roomId: string) => {
    if (!openRoomIds.includes(roomId)) setOpenRoomIds(prev => [...prev, roomId]);
    setUnreadCounts(prev => ({ ...prev, [roomId]: 0 }));
    if (!messages[roomId]) {
      getMessagesForRoom(roomId)
        .then(fetchedMessages => setMessages(prev => ({ ...prev, [roomId]: fetchedMessages })))
        .catch(console.error);
    }
  };

  const closeRoom = (roomId: string) => setOpenRoomIds(prev => prev.filter(id => id !== roomId));

  const startOneOnOneChat = async (targetUserId: string) => {
    try {
      const room = await findOrCreateOneOnOneChat(targetUserId);
      addRoom(room);
      openRoom(room.id);
      const message = `${currentUser?.name}님이 대화를 시작했습니다.`;
      await sendMessage(room.id, message);
    } catch (error) {
      toast.error('1:1 대화 시작에 실패했습니다.');
    }
  };

  const sendSystemMessageToUser = async (targetUserId: string, message: string) => {
    try {
      const room = await findOrCreateOneOnOneChat(targetUserId);
      addRoom(room);
      await sendMessage(room.id, message);
      toast.success('확인 요청 메시지를 전송했습니다.');
    } catch (error) {
      toast.error('메시지 전송에 실패했습니다.');
    }
  };

  const deleteRoom = async (roomId: string): Promise<boolean> => {
    try {
      await apiDeleteChatRoom(roomId);
      removeRoom(roomId);
      toast.success('채팅방을 삭제했습니다.');
      return true;
    } catch (error: any) {
      if (error.response && error.response.status === 404) {
        toast.error('이미 삭제된 채팅방입니다.');
        removeRoom(roomId); // Also remove from local state
      } else {
        toast.error('채팅방 삭제에 실패했습니다.');
        console.error('Failed to delete room', error);
      }
      return false;
    }
  };

  const deleteMessage = async (messageId: string) => {
    try {
      await apiDeleteMessage(messageId);
      // Remove the message from the state
      setMessages(prev => {
        const newMessages = { ...prev };
        for (const roomId in newMessages) {
          newMessages[roomId] = newMessages[roomId].filter(m => m.id !== messageId);
        }
        return newMessages;
      });
    } catch (error) {
      toast.error('메시지 삭제에 실패했습니다.');
      console.error('Failed to delete message', error);
    }
  };

  const getRoomDisplayName = (room: ChatRoom) => {
    if (!room.members) return 'Chat';
    if (room.isGroup) return room.name || 'Group Chat';
    const otherMember = room.members.find(m => m.user.id !== currentUser?.id);
    return otherMember?.user.name || 'Chat';
  };

  const totalUnreadCount = Object.values(unreadCounts).filter(count => count > 0).length;

  return (
    <ChatContext.Provider value={{ rooms, messages, sendMessage, openRoom, closeRoom, openRoomIds, startOneOnOneChat, sendSystemMessageToUser, getRoomDisplayName, deleteRoom, totalUnreadCount, unreadCounts, addRoom, deleteMessage }}>
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (context === undefined) throw new Error('useChat must be used within a ChatProvider');
  return context;
};