import React from 'react';
import { Paper, Box, Typography, useTheme, useMediaQuery } from '@mui/material';
import ChatRoomList from '../components/chat/ChatRoomList';
import MessageView from '../components/chat/MessageView';
import { useChat } from '../contexts/ChatContext';

const ChatPage: React.FC = () => {
  const { openRoomIds } = useChat();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // On mobile, only one room can be active. We'll use the last opened one.
  const activeMobileRoomId = isMobile && openRoomIds.length > 0 ? openRoomIds[openRoomIds.length - 1] : null;

  const DesktopLayout = () => (
    <Paper sx={{ display: 'flex', height: 'calc(100vh - 150px)', overflow: 'hidden' }}>
      <Box sx={{ flexShrink: 0, width: 300, borderRight: '1px solid #ddd', height: '100%', overflowY: 'auto' }}>
        <ChatRoomList />
      </Box>
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

  const MobileLayout = () => (
    <Paper sx={{ height: 'calc(100vh - 120px)', overflow: 'hidden' }}>
      {activeMobileRoomId ? (
        <MessageView roomId={activeMobileRoomId} />
      ) : (
        <ChatRoomList />
      )}
    </Paper>
  );

  return isMobile ? <MobileLayout /> : <DesktopLayout />;
};


export default ChatPage;