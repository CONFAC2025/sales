export interface ChatRoom {
  id: string;
  name: string | null; // Name can be null for 1-on-1 chats
  isGroup: boolean;
  members: { user: { id: string; name: string } }[];
  // ... other fields like _count if needed
}

export interface ChatMessage {
  id: string;
  content: string | null; // Content can be null for file-only messages
  fileUrl?: string;
  fileType?: string;
  createdAt: string;
  sender: { id: string; name: string };
  roomId: string;
}
