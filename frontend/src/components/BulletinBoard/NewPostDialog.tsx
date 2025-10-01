import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Chip,
  IconButton,
} from '@mui/material';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import { createPost } from '../../services/postService';
import { uploadFile } from '../../services/chatService'; // Re-use the chat file upload service
import toast from 'react-hot-toast';

interface NewPostDialogProps {
  open: boolean;
  onClose: () => void;
  onPostCreated: () => void;
}

const NewPostDialog: React.FC<NewPostDialogProps> = ({ open, onClose, onPostCreated }) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [attachment, setAttachment] = useState<{ url: string; type: string; name: string } | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const uploadedFile = await uploadFile(file);
      setAttachment(uploadedFile);
    } catch (error) {
      toast.error('파일 업로드에 실패했습니다.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async () => {
    if (!title || !content) {
      toast.error('제목과 내용을 모두 입력해주세요.');
      return;
    }
    try {
      await createPost({ 
        title, 
        content, 
        fileUrl: attachment?.url,
        fileType: attachment?.type,
      });
      toast.success('게시글이 등록되었습니다.');
      onPostCreated();
      onClose();
      // Reset state
      setTitle('');
      setContent('');
      setAttachment(null);
    } catch (error) {
      toast.error('게시글 등록에 실패했습니다.');
      console.error(error);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>새 공지/지시사항 작성</DialogTitle>
      <DialogContent>
        <TextField
          autoFocus
          margin="dense"
          label="제목"
          fullWidth
          variant="outlined"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <TextField
          margin="dense"
          label="내용"
          fullWidth
          multiline
          rows={10}
          variant="outlined"
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />
        <Box sx={{ mt: 2 }}>
          <input 
            type="file" 
            ref={fileInputRef} 
            style={{ display: 'none' }} 
            onChange={handleFileChange} 
          />
          <Button 
            variant="outlined" 
            startIcon={<AttachFileIcon />} 
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
          >
            {isUploading ? '업로드 중...' : '파일 첨부'}
          </Button>
          {attachment && (
            <Chip 
              label={attachment.name} 
              onDelete={() => setAttachment(null)} 
              sx={{ ml: 1 }}
            />
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>취소</Button>
        <Button onClick={handleSubmit} variant="contained">등록</Button>
      </DialogActions>
    </Dialog>
  );
};

export default NewPostDialog;