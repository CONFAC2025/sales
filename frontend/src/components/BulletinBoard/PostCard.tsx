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
} from '@mui/material';


import type { Post, Comment } from '../../services/postService';
import { createComment } from '../../services/postService';
import toast from 'react-hot-toast';



interface PostCardProps {
  post: Post;
  number: number;
  postIdToExpand: string | null;
}

const PostCard: React.FC<PostCardProps> = ({ post, number, postIdToExpand }) => {
  const [expanded, setExpanded] = useState(false);
  const [comments, setComments] = useState<Comment[]>(post.comments || []);
  const [newComment, setNewComment] = useState('');

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

  return (
    <Card sx={{ mb: 2 }}>
      <CardContent onClick={handleExpandClick} sx={{ cursor: 'pointer' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="h6">{number}. {post.title}</Typography>
            <Chip label={`${post._count.comments}개`} size="small" />
          </Box>
          <Typography variant="caption" color="text.secondary">
            {post.author.name} - {new Date(post.createdAt).toLocaleDateString()}
          </Typography>
        </Box>
        <Typography variant="body2" color="text.secondary">
          {post.content.substring(0, 100)}...
        </Typography>
      </CardContent>
      <Collapse in={expanded} timeout="auto" unmountOnExit>
        <CardContent>
          <Typography paragraph whiteSpace="pre-wrap">{post.content}</Typography>
          
          {post.fileUrl && (
            <Box mb={2}>
              {post.fileType?.startsWith('image/') ? (
                <img 
                  src={`http://localhost:3002${post.fileUrl}`}
                  alt={post.title}
                  style={{ maxWidth: '100%', maxHeight: 400, borderRadius: '4px' }}
                />
              ) : (
                <Button 
                  variant="outlined" 
                  href={`http://localhost:3002${post.fileUrl}`} 
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
  );
};

export default PostCard;
