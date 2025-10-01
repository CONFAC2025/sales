import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  List,
  ListItem,
  Checkbox,
  ListItemText,
  ListItemIcon,
} from '@mui/material';
import { getSubordinates, createChatRoom } from '../../services/chatService';
import type { UserForAdminResponse } from '../../services/adminService';
import { useChat } from '../../contexts/ChatContext';
import toast from 'react-hot-toast';

interface CreateChatRoomDialogProps {
  open: boolean;
  onClose: () => void;
}

const CreateChatRoomDialog: React.FC<CreateChatRoomDialogProps> = ({ open, onClose }) => {
  const [subordinates, setSubordinates] = useState<UserForAdminResponse[]>([]);
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [roomName, setRoomName] = useState('');
  const { addRoom } = useChat();

  useEffect(() => {
    if (open) {
      getSubordinates().then(setSubordinates).catch(console.error);
    }
  }, [open]);

  const handleToggle = (userId: string) => {
    const currentIndex = selectedMembers.indexOf(userId);
    const newChecked = [...selectedMembers];

    if (currentIndex === -1) {
      newChecked.push(userId);
    } else {
      newChecked.splice(currentIndex, 1);
    }
    setSelectedMembers(newChecked);
  };

  const handleSubmit = async () => {
    if (!roomName || selectedMembers.length === 0) {
      toast.error('채팅방 이름과 멤버를 모두 선택해주세요.');
      return;
    }
    try {
      const newRoom = await createChatRoom(roomName, selectedMembers);
      addRoom(newRoom); // Add the new room to the global state
      toast.success(`'${roomName}' 채팅방이 생성되었습니다.`);
      onClose(); // Close the dialog
    } catch (error: any) {
      console.error('Failed to create room', error);
      toast.error(`채팅방 생성 실패: ${error.response?.data?.message || error.message}`);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>신규 채팅방 생성</DialogTitle>
      <DialogContent>
        <TextField
          autoFocus
          margin="dense"
          label="채팅방 이름"
          fullWidth
          variant="standard"
          value={roomName}
          onChange={(e) => setRoomName(e.target.value)}
        />
        <List dense sx={{ width: '100%', bgcolor: 'background.paper' }}>
          <ListItemText primary="멤버 선택" />
          {subordinates.map(user => (
            <ListItem
              key={user.id}
              secondaryAction={<Checkbox edge="end" onChange={() => handleToggle(user.id)} checked={selectedMembers.indexOf(user.id) !== -1} />}
              disablePadding
            >
              <ListItemText primary={user.name} secondary={user.userId} />
            </ListItem>
          ))}
        </List>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>취소</Button>
        <Button onClick={handleSubmit}>생성</Button>
      </DialogActions>
    </Dialog>
  );
};

export default CreateChatRoomDialog;
