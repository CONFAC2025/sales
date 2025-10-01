export type UserStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'SUSPENDED';
export const UserStatusOptions: UserStatus[] = ['PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED'];

export type UserType = 
  | 'ADMIN_STAFF'
  | 'MIDDLE_MANAGER'
  | 'GENERAL_HQ_MANAGER'
  | 'DEPARTMENT_MANAGER'
  | 'TEAM_LEADER'
  | 'SALES_STAFF'
  | 'REAL_ESTATE'
  | 'PARTNER_STAFF';

export const UserTypeOptions: UserType[] = [
  'ADMIN_STAFF',
  'MIDDLE_MANAGER',
  'GENERAL_HQ_MANAGER',
  'DEPARTMENT_MANAGER',
  'TEAM_LEADER',
  'SALES_STAFF',
  'REAL_ESTATE',
  'PARTNER_STAFF',
];

export type CustomerStatus = 'REGISTERED' | 'VISITED' | 'CONSULTED' | 'CONTRACTED' | 'CANCELLED';
export const CustomerStatusOptions: CustomerStatus[] = ['REGISTERED', 'VISITED', 'CONSULTED', 'CONTRACTED', 'CANCELLED'];
