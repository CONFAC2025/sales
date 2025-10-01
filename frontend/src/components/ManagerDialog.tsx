import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Autocomplete,
  TextField,
} from '@mui/material';
import type { UserForAdminResponse } from '../types/admin';

interface ManagerDialogProps {
  open: boolean;
  onClose: () => void;
  users: UserForAdminResponse[];
  currentUser: UserForAdminResponse;
  onSetManager: (managerId: string | null) => void;
}

const ManagerDialog: React.FC<ManagerDialogProps> = ({ open, onClose, users, currentUser, onSetManager }) => {
  const [selectedManager, setSelectedManager] = useState<UserForAdminResponse | null>(null);

  const potentialManagers = users.filter(u => u.id !== currentUser.id);

  const handleSetManager = () => {
    onSetManager(selectedManager ? selectedManager.id : null);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>상급자 설정: {currentUser.name}</DialogTitle>
      <DialogContent>
        <Autocomplete
          options={potentialManagers}
          getOptionLabel={(option) => `${option.name} (${option.userId})`}
          value={selectedManager}
          onChange={(event, newValue) => {
            setSelectedManager(newValue);
          }}
          renderInput={(params) => <TextField {...params} label="상급자 선택" margin="normal" />}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>취소</Button>
        <Button onClick={handleSetManager}>설정</Button>
      </DialogActions>
    </Dialog>
  );
};

export default ManagerDialog;
