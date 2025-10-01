import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  CircularProgress,
  Box,
  Typography,
} from '@mui/material';
import { getChatTargets } from '../../services/chatService';
import { useChat } from '../../contexts/ChatContext';
import type { UserForAdminResponse } from '../../services/adminService';

interface NewChatDialogProps {
  open: boolean;
  onClose: () => void;
}

const NewChatDialog: React.FC<NewChatDialogProps> = ({ open, onClose }) => {
  const [targets, setTargets] = useState<UserForAdminResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const { startOneOnOneChat } = useChat();

  useEffect(() => {
    if (open) {
      setLoading(true);
      getChatTargets()
        .then(setTargets)
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [open]);

  const handleUserSelect = (targetId: string) => {
    startOneOnOneChat(targetId);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>새 대화 시작</DialogTitle>
      <DialogContent dividers>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : targets.length === 0 ? (
          <Typography sx={{ p: 2, textAlign: 'center' }}>대화 가능한 상대가 없습니다.</Typography>
        ) : (
          <List>
            {targets.map(target => (
              <ListItem key={target.id} disablePadding>
                <ListItemButton onClick={() => handleUserSelect(target.id)}>
                  <ListItemText primary={target.name} secondary={target.departmentName || '소속 없음'} />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default NewChatDialog;
