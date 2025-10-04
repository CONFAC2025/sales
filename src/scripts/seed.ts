import { PrismaClient, UserStatus, UserType, CustomerStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('데이터 시딩을 시작합니다...');

  // 0. 기존 테스트 데이터 삭제 (관리자 계정 제외)
  console.log('0. 기존 테스트 데이터 삭제 중...');
  // 관계의 종속성을 고려하여 삭제 순서 중요
  await prisma.notification.deleteMany({});
  await prisma.chatMessage.deleteMany({});
  await prisma.chatRoomMember.deleteMany({});
  await prisma.comment.deleteMany({});
  await prisma.post.deleteMany({});
  await prisma.customer.deleteMany({});
  await prisma.user.deleteMany({ where: { NOT: { userId: 'admin' } } });
  await prisma.team.deleteMany({});
  await prisma.department.deleteMany({});
  console.log('✅ 기존 테스트 데이터 삭제 완료');

  // 1. 관리자 계정 생성 또는 업데이트
  console.log('\n1. 관리자 계정 생성/확인 중...');
  const adminPassword = await bcrypt.hash('Hhky@*^7209', 12);
  const admin = await prisma.user.upsert({
    where: { userId: 'admin' },
    update: {},
    create: {
      userId: 'admin',
      email: 'admin@example.com',
      password: adminPassword,
      name: '시스템관리자',
      phone: '010-0000-0000',
      userType: UserType.ADMIN_STAFF,
      status: UserStatus.APPROVED,
      organizationLevel: 1,
    },
  });
  console.log(`✅ 관리자 계정 생성/확인: ${admin.userId}`);

  // 2. 기본 조직 생성 (10개 본부, 본부별 10개 팀)
  console.log('\n2. 기본 조직 구조 생성 중...');
  for (let i = 1; i <= 10; i++) {
    const department = await prisma.department.create({
      data: {
        name: `${i}본부`,
        code: `D${i}`,
        capacity: 100,
      },
    });
    console.log(`  ✅ ${department.name} 생성 완료`);

    for (let j = 1; j <= 10; j++) {
      await prisma.team.create({
        data: {
          name: `${j}팀`,
          departmentId: department.id,
          capacity: 20,
        },
      });
    }
    console.log(`    ✅ ${department.name} 하위 10개 팀 생성 완료`);
  }

  // 3. 테스트 사용자 생성 (다양한 권한 레벨)
  console.log('\n3. 테스트 사용자 생성 중...');
  const teams = await prisma.team.findMany();
  const departments = await prisma.department.findMany();

  // 총괄본부장 생성
  const generalHqPassword = await bcrypt.hash('password123', 12);
  await prisma.user.create({
    data: {
      userId: 'general_hq',
      email: 'general_hq@example.com',
      password: generalHqPassword,
      name: '총괄본부장',
      phone: '010-1111-1111',
      userType: UserType.GENERAL_HQ_MANAGER,
      status: UserStatus.APPROVED,
      organizationLevel: 2,
    },
  });
  console.log(`  ✅ 총괄본부장 생성 완료`);

  // 본부장 생성
  const deptManagerPassword = await bcrypt.hash('password123', 12);
  await prisma.user.create({
    data: {
      userId: 'dept_manager',
      email: 'dept_manager@example.com',
      password: deptManagerPassword,
      name: '본부장',
      phone: '010-2222-2222',
      userType: UserType.DEPARTMENT_MANAGER,
      status: UserStatus.APPROVED,
      organizationLevel: 2,
      departmentId: departments[0].id,
    },
  });
  console.log(`  ✅ 본부장 생성 완료`);

  // 팀장 생성
  const teamLeaderPassword = await bcrypt.hash('password123', 12);
  await prisma.user.create({
    data: {
      userId: 'team_leader',
      email: 'team_leader@example.com',
      password: teamLeaderPassword,
      name: '팀장',
      phone: '010-3333-3333',
      userType: UserType.TEAM_LEADER,
      status: UserStatus.APPROVED,
      organizationLevel: 3,
      departmentId: teams[0].departmentId,
      teamId: teams[0].id,
    },
  });
  console.log(`  ✅ 팀장 생성 완료`);

  // 일반 사원들 생성 (7명)
  for (let i = 1; i <= 7; i++) {
    const userPassword = await bcrypt.hash('password123', 12);
    const randomTeam = teams[Math.floor(Math.random() * teams.length)];
    await prisma.user.create({
      data: {
        userId: `testuser${i}`,
        email: `test${i}@example.com`,
        password: userPassword,
        name: `테스트사원${i}`,
        phone: `010-1234-567${i}`,
        userType: UserType.SALES_STAFF,
        status: UserStatus.APPROVED,
        organizationLevel: 4,
        departmentId: randomTeam.departmentId,
        teamId: randomTeam.id,
      },
    });
    console.log(`  ✅ 테스트사용자${i} 생성 완료`);
  }

  // 4. 테스트 고객 생성 (10명)
  console.log('\n4. 테스트 고객 생성 중...');
  const users = await prisma.user.findMany({ where: { userType: UserType.SALES_STAFF } });
  for (let i = 1; i <= 10; i++) {
    const randomUser = users[Math.floor(Math.random() * users.length)];
    await prisma.customer.create({
      data: {
        name: `가망고객${i}`,
        phone: `010-9876-543${i}`,
        status: CustomerStatus.REGISTERED,
        notes: '테스트로 생성된 고객입니다.',
        registeredById: randomUser.id,
      },
    });
    console.log(`  ✅ 가망고객${i} 생성 완료 (등록자: ${randomUser.name})`);
  }

  console.log('\n🎉 데이터 시딩이 성공적으로 완료되었습니다.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
