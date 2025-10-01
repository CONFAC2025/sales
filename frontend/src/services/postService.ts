import api from './api';

// Define types based on Prisma schema
export interface Post {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  author: { name: string };
  comments: Comment[];
  _count: { comments: number };
}

export interface Comment {
  id: string;
  content: string;
  createdAt: string;
  author: { name: string };
}

export const getPosts = async (): Promise<Post[]> => {
  const response = await api.get('/posts');
  return response.data.data;
};

export const getPostById = async (postId: string): Promise<Post> => {
  const response = await api.get(`/posts/${postId}`);
  return response.data.data;
};

export const createPost = async (data: { title: string; content: string }): Promise<Post> => {
  const response = await api.post('/posts', data);
  return response.data.data;
};

export const createComment = async (postId: string, content: string): Promise<Comment> => {
  const response = await api.post(`/posts/${postId}/comments`, { content });
  return response.data.data;
};
