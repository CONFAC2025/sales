import React from 'react';
import { Link, ListItemText, Box } from '@mui/material';
import type { ChatMessage } from '../../types/chat';

interface ChatMessageContentProps {
  message: ChatMessage;
}

const ChatMessageContent: React.FC<ChatMessageContentProps> = ({ message }) => {
  const isImage = message.fileType?.startsWith('image/');

  if (message.fileUrl) {
    if (isImage) {
      return (
        <Box component="a" href={`http://localhost:3002${message.fileUrl}`} target="_blank" rel="noopener noreferrer">
          <img 
            src={`http://localhost:3002${message.fileUrl}`}
            alt={message.content || 'chat-image'}
            style={{ maxWidth: '100%', maxHeight: 200, display: 'block' }}
          />
        </Box>
      );
    }
    // Generic file link
    return (
      <Link href={`http://localhost:3002${message.fileUrl}`} target="_blank" rel="noopener noreferrer">
        {message.content}
      </Link>
    );
  }

  return (
    <ListItemText
      primary={message.content}
      secondary={`${message.sender.name} - ${new Date(message.createdAt).toLocaleTimeString()}`}
    />
  );
};

export default ChatMessageContent;
