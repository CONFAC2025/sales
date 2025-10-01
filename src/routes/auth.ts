import { FastifyInstance, FastifyPluginOptions, FastifyRequest, FastifyReply } from 'fastify';
import { AuthService } from '../services/authService';
import { User, UserType } from '@prisma/client';

// 요청 본문의 타입 정의
interface RegisterBody extends Pick<User, 'userId' | 'password' | 'name' | 'phone'> { 
  email?: string;
  organizationRequest?: string;
}

interface LoginBody extends Pick<User, 'userId' | 'password'> {}

export default async function (fastify: FastifyInstance, opts: FastifyPluginOptions) {

  // 회원가입 라우트
  fastify.post('/register', async (request: FastifyRequest<{ Body: RegisterBody }>, reply: FastifyReply) => {
    try {
      const newUser = await AuthService.register(request.body);
      const { password, ...userResponse } = newUser; // 응답에서 비밀번호 제외
      reply.code(201).send({ success: true, data: userResponse, message: '회원가입이 완료되었습니다. 관리자 승인을 기다려주세요.' });
    } catch (error: any) {
      fastify.log.error(error);
      reply.code(400).send({ success: false, message: error.message });
    }
  });

  // 로그인 라우트
  fastify.post('/login', async (request: FastifyRequest<{ Body: LoginBody }>, reply: FastifyReply) => {
    try {
      const { user, accessToken } = await AuthService.login(request.body);
      const { password, ...userResponse } = user; // 응답에서 비밀번호 제외
      reply.code(200).send({ success: true, data: { token: accessToken, user: userResponse }, message: '로그인 성공' });
    } catch (error: any) {
      fastify.log.error(error);
      reply.code(401).send({ success: false, message: error.message });
    }
  });
}