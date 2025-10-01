import React, { useState } from 'react';
import {
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Button,
  Box,
  IconButton,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Badge,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { useChat } from '../../contexts/ChatContext';
import NewChatDialog from './NewChatDialog'; // Import the new dialog
import toast from 'react-hot-toast';

const ChatRoomList: React.FC = () => {
  const { rooms, openRoom, openRoomIds, getRoomDisplayName, deleteRoom, unreadCounts } = useChat();
  const [openNewChatDialog, setOpenNewChatDialog] = useState(false);
  const [openDeleteConfirm, setOpenDeleteConfirm] = useState(false);
  const [roomToDelete, setRoomToDelete] = useState<string | null>(null);

  const handleDeleteClick = (roomId: string) => {
    setRoomToDelete(roomId);
    setOpenDeleteConfirm(true);
  };

  const handleConfirmDelete = async () => {
    if (roomToDelete) {
      const success = await deleteRoom(roomToDelete);
      setOpenDeleteConfirm(false);
      setRoomToDelete(null);
      if (success) {
        toast.success('채팅방이 삭제되었습니다.');
      } else {
        toast.error('채팅방 삭제에 실패했습니다.');
      }
    }
  };

  return (
    <>
      <Box sx={{ p: 1 }}>
        <Button variant="contained" fullWidth onClick={() => setOpenNewChatDialog(true)}>
          새 대화 시작
        </Button>
      </Box>
      <List dense>
        {rooms.map(room => {
          const unreadCount = unreadCounts[room.id] || 0;
          return (
            <ListItem 
              key={room.id} 
              disablePadding
              secondaryAction={
                <IconButton edge="end" aria-label="delete" onClick={() => handleDeleteClick(room.id)}>
                  <DeleteIcon />
                </IconButton>
              }
            >
              <ListItemButton
                selected={openRoomIds.includes(room.id)}
                onClick={() => openRoom(room.id)}
              >
                <ListItemText 
                  primary={getRoomDisplayName(room)} 
                  secondary={`${room.members.length} 명`}
                />
                {unreadCount > 0 && (
                  <Badge badgeContent={unreadCount} color="error" />
                )}
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>
      
      {/* New Chat Dialog */}
      <NewChatDialog 
        open={openNewChatDialog}
        onClose={() => setOpenNewChatDialog(false)}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={openDeleteConfirm}
        onClose={() => setOpenDeleteConfirm(false)}
      >
        <DialogTitle>채팅방 삭제 확인</DialogTitle>
        <DialogContent>
          <DialogContentText>
            정말로 이 채팅방을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDeleteConfirm(false)}>취소</Button>
          <Button onClick={handleConfirmDelete} color="error">
            삭제
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default ChatRoomList;