export interface Notification {
  id: string;
  recipientId: string;
  type: string;
  message: string;
  link?: string;
  isRead: boolean;
  createdAt: string;
}
