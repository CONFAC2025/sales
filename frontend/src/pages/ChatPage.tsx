import React, { useEffect } from 'react';
import { Paper, Box, Typography, useTheme, useMediaQuery, Chip } from '@mui/material';
import ChatRoomList from '../components/chat/ChatRoomList';
import MessageView from '../components/chat/MessageView';
import { useChat } from '../contexts/ChatContext';
import { useNotifications } from '../contexts/NotificationContext';

const ChatPage: React.FC = () => {
  const { openRoomIds, rooms, openRoom, closeRoom, getRoomDisplayName } = useChat();
  const { markAsReadByLinkPrefix } = useNotifications();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const activeRoomId = openRoomIds.length > 0 ? openRoomIds[openRoomIds.length - 1] : null;

  useEffect(() => {
    if (activeRoomId) {
      markAsReadByLinkPrefix(`/chat?roomId=${activeRoomId}`);
    }
  }, [activeRoomId, markAsReadByLinkPrefix]);

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

  const MobileLayout = () => {
    if (openRoomIds.length === 0) {
      return <ChatRoomList />;
    }

    return (
      <Box sx={{ height: 'calc(100vh - 120px)', display: 'flex', flexDirection: 'column' }}>
        <Paper square sx={{ flexShrink: 0, borderBottom: 1, borderColor: 'divider' }}>
          <Box sx={{ display: 'flex', overflowX: 'auto', p: 1, gap: 1 }}>
            {openRoomIds.map(id => {
              const room = rooms.find(r => r.id === id);
              if (!room) return null;
              return (
                <Chip
                  key={id}
                  label={getRoomDisplayName(room)}
                  onClick={() => openRoom(id)}
                  onDelete={() => closeRoom(id)}
                  color={id === activeRoomId ? "primary" : "default"}
                />
              );
            })}
          </Box>
        </Paper>
        
        {activeRoomId && <MessageView roomId={activeRoomId} />}
      </Box>
    );
  };

  return isMobile ? <MobileLayout /> : <DesktopLayout />;
};


export default ChatPage;