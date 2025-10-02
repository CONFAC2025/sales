import { prisma } from '../utils/prisma';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User, UserStatus, UserType } from '@prisma/client';
import { NotificationService } from './notificationService';
import { sendToUser } from '../websocket';

// 타입 정의
type RegisterData = Pick<User, 'userId' | 'password' | 'name' | 'phone'> & { email?: string; organizationRequest?: string };
type LoginData = Pick<User, 'userId' | 'password'>;

export class AuthService {
  private static readonly SALT_ROUNDS = 12;
  private static readonly JWT_SECRET = process.env.JWT_SECRET;

  /**
   * 사용자 등록
   */
  public static async register(data: RegisterData): Promise<User> {
    const existingUser = await prisma.user.findFirst({
      where: { OR: [{ userId: data.userId }, { email: data.email }] },
    });
    if (existingUser) {
      throw new Error('이미 사용 중인 아이디 또는 이메일입니다.');
    }

    const hashedPassword = await bcrypt.hash(data.password, this.SALT_ROUNDS);

    const newUser = await prisma.user.create({
      data: {
        userId: data.userId,
        password: hashedPassword,
        name: data.name,
        phone: data.phone,
        email: data.email,
        organizationRequest: data.organizationRequest,
        status: UserStatus.PENDING, // 승인 대기 상태로 생성
        userType: UserType.SALES_STAFF, // 기본 직급
        organizationLevel: 6, // SALES_STAFF 레벨
      },
    });

    // 관리자에게 알림 보내기
    const admins = await prisma.user.findMany({ where: { userType: { in: ['ADMIN_STAFF', 'MIDDLE_MANAGER', 'GENERAL_HQ_MANAGER'] } } });
    const message = data.organizationRequest
      ? `새로운 사용자 ${newUser.name}님이 가입 승인을 기다립니다. 소속 요청: ${data.organizationRequest}`
      : `새로운 사용자 ${newUser.name}님이 가입 승인을 기다립니다.`;

    for (const admin of admins) {
      const notification = await NotificationService.createNotification({
        recipientId: admin.id,
        type: 'NEW_USER_PENDING',
        message,
        link: `/admin/users`,
      });
      sendToUser(admin.id, { type: 'NEW_NOTIFICATION', payload: notification });
    }

    return newUser;
  }

  /**
   * 사용자 로그인
   */
  public static async login(data: LoginData): Promise<{ user: User; accessToken: string }> {
    console.log('Login attempt with:', data.userId);
    if (!this.JWT_SECRET) {
      throw new Error('JWT 시크릿 키가 설정되지 않았습니다. 서버 설정을 확인하세요.');
    }

    const user = await prisma.user.findUnique({
      where: { userId: data.userId },
    });
    console.log('User found in DB:', user);

    if (!user) {
      console.log('User not found');
      throw new Error('아이디 또는 비밀번호가 올바르지 않습니다.');
    }

    console.log('Comparing passwords...');
    console.log('Plain text password:', data.password);
    console.log('Hashed password from DB:', user.password);
    const isPasswordValid = await bcrypt.compare(data.password, user.password);
    console.log('Password valid:', isPasswordValid);
    if (!isPasswordValid) {
      console.log('Password invalid');
      throw new Error('아이디 또는 비밀번호가 올바르지 않습니다.');
    }

    if (user.status !== UserStatus.APPROVED) {
      console.log('User not approved');
      throw new Error('아직 승인되지 않은 계정입니다.');
    }

    const accessToken = jwt.sign(
      { 
        id: user.id,
        userId: user.userId,
        userType: user.userType,
        organizationLevel: user.organizationLevel
      },
      this.JWT_SECRET,
      { expiresIn: '24h' }
    );

    return { user, accessToken };
  }
}
