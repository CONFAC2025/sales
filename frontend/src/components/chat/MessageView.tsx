import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  TextField,
  Button,
  List,
  ListItem,
  ListItemText,
  Typography,
  Paper,
  Toolbar,
  IconButton,
  Drawer,
  Divider,
} from '@mui/material';
import GroupIcon from '@mui/icons-material/Group';
import DeleteIcon from '@mui/icons-material/Delete';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import CloseIcon from '@mui/icons-material/Close';
import { useChat } from '../../contexts/ChatContext';
import { useAuth } from '../../contexts/AuthContext';
import ChatMessageContent from './ChatMessageContent';

interface MessageViewProps {
  roomId: string;
}

const MessageView: React.FC<MessageViewProps> = ({ roomId }) => {
  const { messages, sendMessage, rooms, getRoomDisplayName, deleteMessage, closeRoom } = useChat();
  const { user } = useAuth();
  const [newMessage, setNewMessage] = useState('');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [hoveredMessageId, setHoveredMessageId] = useState<string | null>(null);
  const messagesEndRef = useRef<null | HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const currentRoom = rooms.find(r => r.id === roomId);
  const roomMessages = messages[roomId] || [];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [roomMessages]);

  const handleSend = () => {
    if (newMessage.trim()) {
      sendMessage(roomId, newMessage.trim());
      setNewMessage('');
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      sendMessage(roomId, file.name, file);
    }
  };

  const handleDeleteMessage = (messageId: string) => {
    deleteMessage(roomId, messageId);
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', position: 'relative' }}>
      {/* Header */}
      <Paper square sx={{ borderBottom: '1px solid #ddd' }}>
        <Toolbar variant="dense">
          <Typography variant="h6" sx={{ flexGrow: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {currentRoom ? getRoomDisplayName(currentRoom) : ''}
          </Typography>
          <IconButton size="small" onClick={() => setIsDrawerOpen(true)}>
            <GroupIcon fontSize="small" />
          </IconButton>
          <IconButton size="small" onClick={() => closeRoom(roomId)}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </Toolbar>
      </Paper>

      {/* Message List */}
      <Box sx={{ flexGrow: 1, overflowY: 'auto', p: 2 }}>
        <List>
          {roomMessages.map((msg) => (
            <ListItem 
              key={msg.id} 
              sx={{ 
                display: 'flex', 
                flexDirection: msg.sender.id === user?.id ? 'row-reverse' : 'row',
                alignItems: 'center',
                mb: 1,
              }}
              onMouseEnter={() => setHoveredMessageId(msg.id)}
              onMouseLeave={() => setHoveredMessageId(null)}
            >
              <Paper 
                variant="outlined" 
                sx={{ 
                  p: 1, 
                  bgcolor: msg.sender.id === user?.id ? 'primary.light' : 'grey.200',
                  maxWidth: '80%'
                }}
              >
                <ChatMessageContent message={msg} />
              </Paper>
              {msg.sender.id === user?.id && hoveredMessageId === msg.id && (
                <IconButton size="small" onClick={() => handleDeleteMessage(msg.id)} sx={{ mx: 1 }}>
                  <DeleteIcon fontSize="small" />
                </IconButton>
              )}
            </ListItem>
          ))}
          <div ref={messagesEndRef} />
        </List>
      </Box>

      {/* Message Input */}
      <Box sx={{ p: 1, borderTop: '1px solid #ddd', display: 'flex' }}>
        <input 
          type="file" 
          ref={fileInputRef} 
          style={{ display: 'none' }} 
          onChange={handleFileChange} 
        />
        <IconButton onClick={() => fileInputRef.current?.click()}>
          <AttachFileIcon />
        </IconButton>
        <TextField
          fullWidth
          size="small"
          variant="outlined"
          placeholder="메시지를 입력하세요"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSend()}
        />
        <Button variant="contained" onClick={handleSend} sx={{ ml: 1 }}>
          전송
        </Button>
      </Box>

      {/* Member List Drawer */}
      <Drawer
        anchor="right"
        open={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
      >
        <Box
          sx={{ width: 250, p: 2 }}
          role="presentation"
        >
          <Typography variant="h6" gutterBottom>대화상대</Typography>
          <Divider />
          <List>
            {currentRoom?.members.map(member => (
              <ListItem key={member.user.id}>
                <ListItemText primary={member.user.name} />
              </ListItem>
            ))}
          </List>
        </Box>
      </Drawer>
    </Box>
  );
};

export default MessageView;