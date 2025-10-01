import type { User } from '../types/user';

export const translateUserType = (userType: User['userType']): string => {
  switch (userType) {
    case 'ADMIN_STAFF':
      return '최고관리자';
    case 'MIDDLE_MANAGER':
      return '중간관리자';
    case 'GENERAL_HQ_MANAGER':
      return '총괄본부장';
    case 'DEPARTMENT_MANAGER':
      return '본부장';
    case 'TEAM_LEADER':
      return '팀장';
    case 'SALES_STAFF':
      return '팀원';
    case 'REAL_ESTATE':
      return '중개업소';
    case 'PARTNER_STAFF':
      return '협력업체';
    default:
      return userType;
  }
};
