export interface User {
  id: string;
  userId: string;
  email: string | null;
  name: string;
  phone: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'SUSPENDED';
  userType: 'ADMIN_STAFF' | 'MIDDLE_MANAGER' | 'GENERAL_HQ_MANAGER' | 'DEPARTMENT_MANAGER' | 'TEAM_LEADER' | 'SALES_STAFF' | 'REAL_ESTATE' | 'PARTNER_STAFF';
  organizationLevel: number;
  departmentId: string | null;
  teamId: string | null;
  managerId: string | null;
  createdAt: string;
  updatedAt: string;
  _count?: {
    registeredCustomers: number;
  };
}
