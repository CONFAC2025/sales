import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Collapse,
  List,
  ListItem,
  ListItemText,
  Box,
  TextField,
  Button,
  Chip,
  IconButton,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import type { Post, Comment } from '../../services/postService';
import { createComment, deletePost } from '../../services/postService';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';
import { getFullUrl } from '../../utils/url';

interface PostCardProps {
  post: Post;
  number: number;
  postIdToExpand: string | null;
  onPostDeleted: () => void;
}

const PostCard: React.FC<PostCardProps> = ({ post, number, postIdToExpand, onPostDeleted }) => {
  const [expanded, setExpanded] = useState(false);
  const [comments, setComments] = useState<Comment[]>(post.comments || []);
  const [newComment, setNewComment] = useState('');
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (postIdToExpand && postIdToExpand === post.id) {
      setExpanded(true);
    }
  }, [postIdToExpand, post.id]);

  const handleExpandClick = () => {
    setExpanded(!expanded);
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    try {
      const addedComment = await createComment(post.id, newComment.trim());
      setComments(prev => [...prev, addedComment]);
      setNewComment('');
      toast.success('댓글이 등록되었습니다.');
    } catch (error) {
      toast.error('댓글 등록에 실패했습니다.');
      console.error(error);
    }
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card from expanding
    setOpenDeleteDialog(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      await deletePost(post.id);
      toast.success('게시글이 삭제되었습니다.');
      onPostDeleted(); // Refresh the list in the parent component
    } catch (error) {
      toast.error('게시글 삭제에 실패했습니다.');
    } finally {
      setOpenDeleteDialog(false);
    }
  };

  const isAdmin = user?.userType === 'ADMIN_STAFF';

  return (
    <>
      <Card sx={{ mb: 2 }}>
        <CardContent onClick={handleExpandClick} sx={{ cursor: 'pointer' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="h6">{number}. {post.title}</Typography>
              <Chip label={`${post._count.comments}개`} size="small" />
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Typography variant="caption" color="text.secondary" sx={{ mr: 1 }}>
                {post.author.name} - {new Date(post.createdAt).toLocaleDateString()}
              </Typography>
              {isAdmin && (
                <IconButton size="small" onClick={handleDeleteClick}>
                  <DeleteIcon fontSize="small" />
                </IconButton>
              )}
            </Box>
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1, whiteSpace: 'pre-wrap' }}>
            {expanded ? post.content : `${post.content.substring(0, 100)}...`}
          </Typography>
        </CardContent>
        <Collapse in={expanded} timeout="auto" unmountOnExit>
          <CardContent>
            {post.fileUrl && (
              <Box mb={2}>
                {post.fileType?.startsWith('image/') ? (
                  <img 
                    src={getFullUrl(post.fileUrl)}
                    alt={post.title}
                    style={{ maxWidth: '100%', maxHeight: 400, borderRadius: '4px' }}
                  />
                ) : (
                  <Button 
                    variant="outlined" 
                    href={getFullUrl(post.fileUrl)} 
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    첨부파일 다운로드
                  </Button>
                )}
              </Box>
            )}

            <Typography variant="h6" gutterBottom>댓글</Typography>
            <List dense>
              {comments.map(comment => (
                <ListItem key={comment.id}>
                  <ListItemText 
                    primary={comment.content} 
                    secondary={`${comment.author.name} - ${new Date(comment.createdAt).toLocaleDateString()}`}
                  />
                </ListItem>
              ))}
            </List>
            <Box sx={{ display: 'flex', mt: 2 }}>
              <TextField 
                fullWidth 
                size="small" 
                label="댓글 추가"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
              />
              <Button onClick={handleAddComment} sx={{ ml: 1 }} variant="contained">등록</Button>
            </Box>
          </CardContent>
        </Collapse>
      </Card>

      <Dialog
        open={openDeleteDialog}
        onClose={() => setOpenDeleteDialog(false)}
      >
        <DialogTitle>게시글 삭제 확인</DialogTitle>
        <DialogContent>
          <DialogContentText>
            정말로 이 게시글을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDeleteDialog(false)}>취소</Button>
          <Button onClick={handleDeleteConfirm} color="error" autoFocus>
            삭제
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default PostCard;