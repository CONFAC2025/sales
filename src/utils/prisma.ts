import { PrismaClient } from '@prisma/client';

// Prisma Client 인스턴스를 전역적으로 한 번만 생성하여 사용합니다.
export const prisma = new PrismaClient();
