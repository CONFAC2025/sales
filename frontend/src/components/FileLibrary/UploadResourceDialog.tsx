import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
} from '@mui/material';
import { createResource } from '../../services/resourceService';
import toast from 'react-hot-toast';

interface UploadResourceDialogProps {
  open: boolean;
  onClose: () => void;
  onResourceUploaded: () => void;
}

const UploadResourceDialog: React.FC<UploadResourceDialogProps> = ({ open, onClose, onResourceUploaded }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async () => {
    if (!title || !file) {
      setError('제목과 파일은 필수 항목입니다.');
      return;
    }
    setError('');

    try {
      await createResource({ title, description, file });
      toast.success('자료가 업로드되었습니다.');
      onResourceUploaded();
      onClose();
      // Reset form
      setTitle('');
      setDescription('');
      setFile(null);
    } catch (err) {
      toast.error('업로드에 실패했습니다.');
      console.error(err);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>새 자료 업로드</DialogTitle>
      <DialogContent>
        <TextField
          autoFocus
          margin="dense"
          label="제목"
          type="text"
          fullWidth
          variant="standard"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
        <TextField
          margin="dense"
          label="설명 (선택 사항)"
          type="text"
          fullWidth
          multiline
          rows={4}
          variant="standard"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <Box mt={2}>
          <Button variant="contained" component="label">
            파일 선택
            <input type="file" hidden onChange={handleFileChange} />
          </Button>
          {file && <Typography variant="body2" sx={{ display: 'inline', ml: 2 }}>{file.name}</Typography>}
        </Box>
        {error && <Typography color="error" sx={{ mt: 2 }}>{error}</Typography>}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>취소</Button>
        <Button onClick={handleSubmit}>업로드</Button>
      </DialogActions>
    </Dialog>
  );
};

export default UploadResourceDialog;
