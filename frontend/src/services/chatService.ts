import api from './api';
import type { UserForAdminResponse } from '../types/admin';
import type { ChatRoom, ChatMessage } from '../types/chat'; // Import from new types file

// API Calls

export const getSubordinates = async (): Promise<UserForAdminResponse[]> => {
  const response = await api.get('/chat/subordinates');
  return response.data.data;
};

export const createChatRoom = async (name: string, memberIds: string[]): Promise<ChatRoom> => {
  const response = await api.post('/chat/rooms', { name, memberIds });
  return response.data.data;
};

export const getMyChatRooms = async (): Promise<ChatRoom[]> => {
  const response = await api.get('/chat/rooms');
  return response.data.data;
};

export const getChatTargets = async (): Promise<UserForAdminResponse[]> => {
  const response = await api.get('/chat/targets');
  return response.data.data;
};

export const getMessagesForRoom = async (roomId: string): Promise<ChatMessage[]> => {
  const response = await api.get(`/chat/rooms/${roomId}/messages`);
  return response.data.data;
};

export const findOrCreateOneOnOneChat = async (targetUserId: string): Promise<ChatRoom> => {
  const response = await api.post('/chat/one-on-one', { targetUserId });
  return response.data.data;
};

export const deleteChatRoom = async (roomId: string): Promise<void> => {
  await api.delete(`/chat/rooms/${roomId}`);
};

export const deleteMessage = async (messageId: string): Promise<void> => {
  await api.delete(`/chat/messages/${messageId}`);
};

export const uploadFile = async (file: File): Promise<{ url: string, type: string, name: string }> => {
  const formData = new FormData();
  formData.append('file', file);
  const response = await api.post('/chat/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data.data;
};

export const sendMessage = async (roomId: string, content: string, file?: File): Promise<ChatMessage> => {
  let filePayload: { url: string, type: string, name: string } | undefined = undefined;
  if (file) {
    filePayload = await uploadFile(file);
  }
  const response = await api.post('/chat/messages', { 
    roomId, 
    content: file ? file.name : content, 
    fileUrl: filePayload?.url, 
    fileType: filePayload?.type 
  });
  return response.data.data;
};
