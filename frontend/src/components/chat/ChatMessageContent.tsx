import React from 'react';
import { Link, ListItemText, Box, Typography, Paper } from '@mui/material';
import type { ChatMessage } from '../../types/chat';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';

interface ChatMessageContentProps {
  message: ChatMessage;
}

const fileBaseUrl = 'https://sales-ofg0.onrender.com';

const ChatMessageContent: React.FC<ChatMessageContentProps> = ({ message }) => {
  const isImage = message.fileType?.startsWith('image/');

  // Handle file messages
  if (message.fileUrl) {
    const fullFileUrl = `${fileBaseUrl}${message.fileUrl}`;

    const contentNode = message.content ? (
      <Typography variant="body2" sx={{ mb: 1 }}>
        {message.content}
      </Typography>
    ) : null;

    if (isImage) {
      return (
        <Box>
          {contentNode}
          <Link href={fullFileUrl} target="_blank" rel="noopener noreferrer">
            <img 
              src={fullFileUrl}
              alt={message.fileName || 'chat-image'}
              style={{ maxWidth: '100%', maxHeight: 250, display: 'block', borderRadius: '8px' }}
            />
          </Link>
        </Box>
      );
    }
    
    // Generic file link
    return (
      <Box>
        {contentNode}
        <Link href={fullFileUrl} target="_blank" rel="noopener noreferrer" underline="none">
          <Paper variant="outlined" sx={{ p: 1, display: 'flex', alignItems: 'center', gap: 1, maxWidth: '100%' }}>
            <InsertDriveFileIcon />
            <Typography variant="body2" sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {message.fileName || '첨부파일'}
            </Typography>
          </Paper>
        </Link>
      </Box>
    );
  }

  // Handle text-only messages
  return (
    <ListItemText
      primary={message.content}
      secondary={`${message.sender.name} - ${new Date(message.createdAt).toLocaleTimeString()}`}
      sx={{ m: 0 }}
    />
  );
};

export default ChatMessageContent;
