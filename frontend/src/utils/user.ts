import type { User } from '../types/user';
import type { CustomerStatus, PotentialLevel } from '../types/customer';

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

export const translateCustomerStatus = (status: CustomerStatus | string | null): string => {
  switch (status) {
    case 'REGISTERED': return '등록';
    case 'VISITED': return '방문';
    case 'CONSULTED': return '상담';
    case 'CONTRACTED': return '계약';
    case 'CANCELLED': return '취소';
    default: return String(status);
  }
};

export const translatePotentialLevel = (potential: PotentialLevel | string | null): string => {
  switch (potential) {
    case 'HIGH': return '상';
    case 'MEDIUM': return '중';
    case 'LOW': return '하';
    default: return String(potential);
  }
};