import { FastifyRequest, FastifyReply, FastifyInstance } from 'fastify';
import jwt from 'jsonwebtoken';
import { UserType } from '@prisma/client';

const JWT_SECRET = process.env.JWT_SECRET;

interface JwtPayload {
  id: string;
  userId: string;
  userType: UserType;
  organizationLevel: number;
}

// FastifyRequest 인터페이스 확장
declare module 'fastify' {
  interface FastifyRequest {
    user?: JwtPayload;
  }
}

export const authMiddleware = (allowedUserTypes?: UserType[]) => {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    console.log(`[Auth] Request for: ${request.raw.url}`);
    console.log('[Auth] Headers:', request.headers);

    if (!JWT_SECRET) {
      console.error('[Auth] JWT_SECRET not set');
      throw new Error('JWT 시크릿 키가 설정되지 않았습니다.');
    }

    const authHeader = request.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('[Auth] No auth header or not Bearer');
      reply.code(401).send({ message: '인증 토큰이 필요합니다.' });
      return;
    }

    const token = authHeader.split(' ')[1];

    try {
      const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
      request.user = decoded;

      console.log(`[Auth] Decoded user info:`, {
        id: decoded.id,
        userId: decoded.userId,
        userType: decoded.userType,
        organizationLevel: decoded.organizationLevel
      });
      console.log(`[Auth] Allowed user types:`, allowedUserTypes);

      // 3. Check if user type is allowed (if specific types are required)
      if (Array.isArray(allowedUserTypes) && allowedUserTypes.length > 0 && !allowedUserTypes.includes(decoded.userType)) {
        console.log(`[Auth] Permission denied - User type ${decoded.userType} not in allowed types:`, allowedUserTypes);
        return reply.code(403).send({ 
          message: 'Permission denied.',
          userType: decoded.userType,
          allowedTypes: allowedUserTypes
        });
      }

      console.log(`[Auth] Success for user: ${decoded.userId}`);
    } catch (error) {
      console.error('[Auth] Token verification failed:', error);
      reply.code(401).send({ message: '유효하지 않은 토큰입니다.' });
    }
  };
};
