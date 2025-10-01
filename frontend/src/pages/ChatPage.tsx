import React from 'react';
import { Paper, Box, Typography } from '@mui/material';
import ChatRoomList from '../components/chat/ChatRoomList';
import MessageView from '../components/chat/MessageView';
import { useChat } from '../contexts/ChatContext';

const ChatPage: React.FC = () => {
  const { openRoomIds } = useChat();

  return (
    <Paper sx={{ display: 'flex', height: 'calc(100vh - 150px)', overflow: 'hidden' }}>
      {/* Chat Room List - Fixed on the left */}
      <Box sx={{ flexShrink: 0, width: 300, borderRight: '1px solid #ddd', height: '100%', overflowY: 'auto' }}>
        <ChatRoomList />
      </Box>
      
      {/* Chat Windows Area - Scrollable on the right */}
      <Box sx={{ display: 'flex', flexGrow: 1, overflowX: 'auto' }}>
        {openRoomIds.length === 0 && (
          <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', flexGrow: 1 }}>
            <Typography variant="h6" color="text.secondary">
              채팅방을 선택하여 대화를 시작하세요.
            </Typography>
          </Box>
        )}

        {openRoomIds.map(roomId => (
          <Box key={roomId} sx={{ flexShrink: 0, minWidth: 400, width: 400, borderRight: '1px solid #ddd', height: '100%' }}>
            <MessageView roomId={roomId} />
          </Box>
        ))}
      </Box>
    </Paper>
  );
};

export default ChatPage;