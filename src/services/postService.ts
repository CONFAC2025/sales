import { prisma } from '../utils/prisma';
import { Post, Comment, Prisma } from '@prisma/client';
import { NotificationService } from './notificationService';
import { sendToUser } from '../websocket';

export class PostService {
  /**
   * Get all posts
   */
  public static async getPosts(): Promise<Post[]> {
    return prisma.post.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        author: { select: { name: true } },
        _count: { select: { comments: true } },
        comments: { // Include actual comments
          include: {
            author: { select: { id: true, name: true } },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    });
  }

  /**
   * Get a single post by ID, including its comments
   */
  public static async getPostById(postId: string): Promise<Post | null> {
    return prisma.post.findUnique({
      where: { id: postId },
      include: {
        author: { select: { name: true } },
        comments: {
          include: {
            author: { select: { name: true } },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    });
  }

  /**
   * Create a new post
   */
  public static async createPost(data: { title: string; content: string; authorId: string; fileUrl?: string; fileType?: string }): Promise<Post> {
    return prisma.post.create({
      data: {
        title: data.title,
        content: data.content,
        fileUrl: data.fileUrl,
        fileType: data.fileType,
        author: { connect: { id: data.authorId } },
      },
    });
  }

  /**
   * Create a new comment on a post
   */
  public static async createComment(data: { content: string; postId: string; authorId: string }): Promise<Comment> {
    const post = await prisma.post.findUnique({ where: { id: data.postId } });
    if (!post) {
      throw new Error('Post not found');
    }

    const newComment = await prisma.comment.create({
      data: {
        content: data.content,
        post: { connect: { id: data.postId } },
        author: { connect: { id: data.authorId } },
      },
      include: {
        author: { select: { name: true } },
      },
    });

    // Notify post author
    if (post.authorId !== data.authorId) {
      const notification = await NotificationService.createNotification({
        recipientId: post.authorId,
        type: 'NEW_COMMENT',
        message: `${newComment.author.name}님이 회원님의 게시글에 댓글을 남겼습니다.`,
        link: `/?postId=${data.postId}`,
      });
      sendToUser(post.authorId, { type: 'NEW_NOTIFICATION', payload: notification });
    }

    return newComment;
  }

  /**
   * Delete a post and all its comments
   */
  public static async deletePost(postId: string): Promise<void> {
    await prisma.$transaction([
      prisma.comment.deleteMany({ where: { postId } }),
      prisma.post.delete({ where: { id: postId } }),
    ]);
  }
}
