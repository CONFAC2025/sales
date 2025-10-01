import React, { useState, useEffect } from 'react';
import { Box, Typography, Button } from '@mui/material';
import { getPosts } from '../../services/postService';
import type { Post } from '../../services/postService';
import PostCard from './PostCard';
import NewPostDialog from './NewPostDialog';
import { useAuth } from '../../contexts/AuthContext';

interface BulletinBoardProps {
  postIdToExpand: string | null;
}

const BulletinBoard: React.FC<BulletinBoardProps> = ({ postIdToExpand }) => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [openNewPost, setOpenNewPost] = useState(false);
  const { user } = useAuth();

  const fetchPosts = () => {
    getPosts()
      .then(setPosts)
      .catch(console.error);
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const isAdmin = user?.userType === 'ADMIN_STAFF';

  return (
    <Box sx={{ mt: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h5">공지사항 / 지시사항</Typography>
        {isAdmin && (
          <Button variant="contained" onClick={() => setOpenNewPost(true)}>
            새 글 작성
          </Button>
        )}
      </Box>
      {posts.map((post, index) => (
        <PostCard key={post.id} post={post} number={posts.length - index} postIdToExpand={postIdToExpand} />
      ))}
      <NewPostDialog 
        open={openNewPost} 
        onClose={() => setOpenNewPost(false)} 
        onPostCreated={fetchPosts} 
      />
    </Box>
  );
};

export default BulletinBoard;
