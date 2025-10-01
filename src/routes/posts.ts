import { FastifyInstance, FastifyPluginOptions, FastifyRequest } from 'fastify';
import { UserType } from '@prisma/client';
import { authMiddleware } from '../middleware/auth';
import { PostService } from '../services/postService';

interface PostBody {
  title: string;
  content: string;
  fileUrl?: string;
  fileType?: string;
}

interface CommentBody {
  content: string;
}

export default async function (fastify: FastifyInstance, opts: FastifyPluginOptions) {

  // Publicly accessible GET routes
  fastify.get('/', async (request, reply) => {
    const posts = await PostService.getPosts();
    reply.send({ success: true, data: posts });
  });

  fastify.get('/:id', async (request: FastifyRequest<{ Params: { id: string } }>, reply) => {
    const post = await PostService.getPostById(request.params.id);
    reply.send({ success: true, data: post });
  });

  // Routes for any authenticated user
  fastify.register(async function(fastifyInstance) {
    fastifyInstance.addHook('preHandler', authMiddleware([]));

    fastifyInstance.post('/:id/comments', async (request: FastifyRequest<{ Params: { id: string }, Body: CommentBody }>, reply) => {
      const userPayload = request.user!;
      const { content } = request.body;
      const comment = await PostService.createComment({
        content,
        postId: request.params.id,
        authorId: userPayload.id,
      });
      reply.code(201).send({ success: true, data: comment });
    });
  });

  // Routes for Admins only
  fastify.register(async function(fastifyInstance) {
    fastifyInstance.addHook('preHandler', authMiddleware([UserType.ADMIN_STAFF]));

    fastifyInstance.post('/', async (request: FastifyRequest<{ Body: PostBody }>, reply) => {
      const userPayload = request.user!;
      const { title, content, fileUrl, fileType } = request.body;
      const post = await PostService.createPost({ title, content, authorId: userPayload.id, fileUrl, fileType });
      reply.code(201).send({ success: true, data: post });
    });
  });
}