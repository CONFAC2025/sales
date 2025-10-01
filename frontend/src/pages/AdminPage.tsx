import React, { useEffect, useState, useMemo } from 'react';
import {
  Typography,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  TableSortLabel,
} from '@mui/material';
import type { SelectChangeEvent } from '@mui/material/Select';
import ChatIcon from '@mui/icons-material/Chat';
import SupervisorAccountIcon from '@mui/icons-material/SupervisorAccount';
import { getUsersForAdmin, updateUserStatus, createUser, updateUserType, assignOrg, setUserManager } from '../services/adminService';
import { getDepartments, getTeams } from '../services/organizationService';
import type { Department, Team } from '../services/organizationService';
import { UserStatus, UserType } from '@prisma/client';
import type { UserForAdminResponse, CreateUserPayload } from '../types/admin';
import UserForm from '../components/UserForm';
import CustomerDetailsModal from '../components/CustomerDetailsModal';
import ManagerDialog from '../components/ManagerDialog';
import ActivityLogDialog from '../components/ActivityLogDialog';
import toast from 'react-hot-toast';
import { useChat } from '../contexts/ChatContext';
import { useNotifications } from '../contexts/NotificationContext';
import { translateUserType } from '../utils/user';

const AdminPage: React.FC = () => {
  const [users, setUsers] = useState<UserForAdminResponse[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [error, setError] = useState<string>('');
  const [openUserDialog, setOpenUserDialog] = useState(false);
  const [openDetailsModal, setOpenDetailsModal] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [openManagerDialog, setOpenManagerDialog] = useState(false);
  const [selectedUserForManager, setSelectedUserForManager] = useState<UserForAdminResponse | null>(null);
  const [logDialogOpen, setLogDialogOpen] = useState(false);
  const [selectedUserForLog, setSelectedUserForLog] = useState<UserForAdminResponse | null>(null);
  const { startOneOnOneChat } = useChat();
  const { notifications } = useNotifications();

  const [sortConfig, setSortConfig] = useState<{ field: string; order: 'asc' | 'desc' }>({ field: 'createdAt', order: 'desc' });

  const unreadNewUserMessages = useMemo(() => {
    const messageMap = new Map<string, string>();
    notifications
      .filter(n => !n.isRead && typeof n.link === 'string' && n.link === '/admin/users')
      .forEach(n => {
        // Extract user name from message like "새로운 사용자 OOO님이 가입 승인을 기다립니다."
        const match = n.message.match(/새로운 사용자 (.*?)님이/);
        if (match && match[1]) {
          messageMap.set(match[1], n.message);
        }
      });
    return messageMap;
  }, [notifications]);

  const fetchData = async () => {
    try {
      const [fetchedUsers, fetchedDepartments, fetchedTeams] = await Promise.all([
        getUsersForAdmin({}, sortConfig),
        getDepartments(),
        getTeams(),
      ]);
      setUsers(fetchedUsers);
      setDepartments(fetchedDepartments);
      setTeams(fetchedTeams);
    } catch (err) {
      setError('Failed to fetch data.');
      toast.error('데이터를 불러오는데 실패했습니다.');
    }
  };

  useEffect(() => {
    fetchData();
  }, [sortConfig]);

  const handleSort = (field: string) => {
    const isAsc = sortConfig.field === field && sortConfig.order === 'asc';
    setSortConfig({ field, order: isAsc ? 'desc' : 'asc' });
  };

  const handleStatusChange = async (userId: string, newStatus: UserStatus) => {
    try {
      await updateUserStatus(userId, newStatus);
      setUsers(prev => prev.map(user => user.id === userId ? { ...user, status: newStatus } : user));
      toast.success('사용자 상태가 변경되었습니다.');
    } catch (err) {
      toast.error('상태 변경에 실패했습니다.');
    }
  };

  const handleUserTypeChange = async (userId: string, newUserType: UserType) => {
    try {
      await updateUserType(userId, newUserType);
      setUsers(prev => prev.map(user => user.id === userId ? { ...user, userType: newUserType } : user));
      toast.success('사용자 직급이 변경되었습니다.');
    } catch (err) {
      toast.error('직급 변경에 실패했습니다.');
    }
  };

  const handleOrgChange = async (userId: string, departmentId: string | null, teamId: string | null) => {
    try {
      await assignOrg(userId, departmentId, teamId);
      // Refetch user to get updated department and team names
      fetchData();
      toast.success('사용자 조직이 변경되었습니다.');
    } catch (err) {
      toast.error('조직 변경에 실패했습니다.');
    }
  };

  const handleSetManager = async (managerId: string | null) => {
    if (!selectedUserForManager) return;
    try {
      await setUserManager(selectedUserForManager.id, managerId);
      fetchData();
      toast.success('상급자가 설정되었습니다.');
    } catch (err) {
      toast.error('상급자 설정에 실패했습니다.');
    }
  };

  const handleCreateUser = async (data: CreateUserPayload) => {
    try {
      await createUser(data);
      setOpenUserDialog(false);
      fetchData();
      toast.success('신규 사용자가 등록되었습니다.');
    } catch (err: any) {
      toast.error(`사용자 등록 실패: ${err.response?.data?.message || err.message}`);
    }
  };

  const handleRowClick = (user: UserForAdminResponse) => {
    setSelectedUserForLog(user);
    setLogDialogOpen(true);
  };

  const getStatusChip = (status: UserStatus) => {
    const statusMap = {
      APPROVED: <Chip label="승인" color="success" size="small" />,
      PENDING: <Chip label="대기" color="warning" size="small" />,
      REJECTED: <Chip label="거절" color="error" size="small" />,
      SUSPENDED: <Chip label="정지" color="default" size="small" />,
    };
    return statusMap[status] || <Chip label={status} size="small" />;
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h4" gutterBottom>사용자 관리</Typography>
        <Button variant="contained" onClick={() => setOpenUserDialog(true)}>신규 사용자 등록</Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell sx={{ p: { xs: 1, sm: 2 } }}>
                <TableSortLabel
                  active={sortConfig.field === 'userId'}
                  direction={sortConfig.field === 'userId' ? sortConfig.order : 'asc'}
                  onClick={() => handleSort('userId')}
                >
                  아이디
                </TableSortLabel>
              </TableCell>
              <TableCell sx={{ p: { xs: 1, sm: 2 } }}>
                <TableSortLabel
                  active={sortConfig.field === 'name'}
                  direction={sortConfig.field === 'name' ? sortConfig.order : 'asc'}
                  onClick={() => handleSort('name')}
                >
                  이름
                </TableSortLabel>
              </TableCell>
              <TableCell sx={{ p: { xs: 1, sm: 2 } }}>연락처</TableCell>
              <TableCell sx={{ p: { xs: 1, sm: 2 } }}>직급</TableCell>
              <TableCell sx={{ p: { xs: 1, sm: 2 } }}>
                <TableSortLabel
                  active={sortConfig.field === 'department'}
                  direction={sortConfig.field === 'department' ? sortConfig.order : 'asc'}
                  onClick={() => handleSort('department')}
                >
                  부서(본부)
                </TableSortLabel>
              </TableCell>
              <TableCell sx={{ p: { xs: 1, sm: 2 } }}>
                <TableSortLabel
                  active={sortConfig.field === 'team'}
                  direction={sortConfig.field === 'team' ? sortConfig.order : 'asc'}
                  onClick={() => handleSort('team')}
                >
                  팀
                </TableSortLabel>
              </TableCell>
              <TableCell sx={{ p: { xs: 1, sm: 2 } }}>상태</TableCell>
              <TableCell sx={{ p: { xs: 1, sm: 2 } }}>
                <TableSortLabel
                  active={sortConfig.field === 'customerCount'}
                  direction={sortConfig.field === 'customerCount' ? sortConfig.order : 'asc'}
                  onClick={() => handleSort('customerCount')}
                >
                  고객등록수
                </TableSortLabel>
              </TableCell>
              <TableCell align="right" sx={{ p: { xs: 1, sm: 2 } }}>작업</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.map((user) => (
              <TableRow 
                key={user.id} 
                hover 
                sx={{ cursor: 'pointer' }}
                onClick={() => handleRowClick(user)}
              >
                <TableCell sx={{ p: { xs: 1, sm: 2 } }}>{user.userId}</TableCell>
                <TableCell sx={{ p: { xs: 1, sm: 2 } }}>
                  <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                    <Typography component="span">{user.name}</Typography>
                    {user.status === 'PENDING' && unreadNewUserMessages.has(user.name) && (
                      <Typography variant="caption" color="secondary.main">
                        {unreadNewUserMessages.get(user.name)}
                      </Typography>
                    )}
                  </Box>
                </TableCell>
                <TableCell sx={{ p: { xs: 1, sm: 2 } }}>{user.phone}</TableCell>
                <TableCell sx={{ p: { xs: 1, sm: 2 } }} onClick={(e) => e.stopPropagation()}>
                  <FormControl size="small" sx={{ minWidth: 120 }}>
                    <Select
                      value={user.userType}
                      onChange={(e) => handleUserTypeChange(user.id, e.target.value as UserType)}
                    >
                      {Object.values(UserType).map((type) => (
                        <MenuItem key={type} value={type}>
                          {translateUserType(type)}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </TableCell>
                <TableCell sx={{ p: { xs: 1, sm: 2 } }} onClick={(e) => e.stopPropagation()}>
                  <FormControl size="small" sx={{ minWidth: 120 }}>
                    <Select
                      value={user.departmentId || ''}
                      onChange={(e) => handleOrgChange(user.id, e.target.value, null)}
                    >
                      <MenuItem value=""><em>미지정</em></MenuItem>
                      {departments.map((dept) => (
                        <MenuItem key={dept.id} value={dept.id}>
                          {dept.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </TableCell>
                <TableCell sx={{ p: { xs: 1, sm: 2 } }} onClick={(e) => e.stopPropagation()}>
                  <FormControl size="small" sx={{ minWidth: 120 }}>
                    <Select
                      value={user.teamId || ''}
                      onChange={(e) => handleOrgChange(user.id, user.departmentId, e.target.value)}
                      disabled={!user.departmentId}
                    >
                      <MenuItem value=""><em>미지정</em></MenuItem>
                      {teams.filter(team => team.departmentId === user.departmentId).map((team) => (
                        <MenuItem key={team.id} value={team.id}>
                          {team.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </TableCell>
                <TableCell sx={{ p: { xs: 1, sm: 2 } }} onClick={(e) => e.stopPropagation()}>
                  <FormControl size="small" sx={{ minWidth: 100 }}>
                    <Select value={user.status} onChange={(e) => handleStatusChange(user.id, e.target.value as UserStatus)} renderValue={(s) => getStatusChip(s)}>
                      <MenuItem value="PENDING">대기</MenuItem>
                      <MenuItem value="APPROVED">승인</MenuItem>
                      <MenuItem value="REJECTED">거절</MenuItem>
                      <MenuItem value="SUSPENDED">정지</MenuItem>
                    </Select>
                  </FormControl>
                </TableCell>
                <TableCell sx={{ p: { xs: 1, sm: 2 } }} onClick={(e) => e.stopPropagation()}>
                  <Button size="small" onClick={() => { setSelectedUserId(user.id); setOpenDetailsModal(true); }}>
                    {user.registeredCustomersCount}
                  </Button>
                </TableCell>
                <TableCell align="right" sx={{ p: { xs: 1, sm: 2 } }} onClick={(e) => e.stopPropagation()}>
                  <IconButton size="small" onClick={() => startOneOnOneChat(user.id)}><ChatIcon /></IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {selectedUserForLog && (
        <ActivityLogDialog
          open={logDialogOpen}
          onClose={() => setLogDialogOpen(false)}
          entityType="USER"
          entityId={selectedUserForLog.id}
          entityName={selectedUserForLog.name}
        />
      )}

      <Dialog open={openUserDialog} onClose={() => setOpenUserDialog(false)} fullWidth maxWidth="sm">
        <DialogTitle>신규 사용자 등록</DialogTitle>
        <DialogContent><UserForm onSubmit={handleCreateUser} onCancel={() => setOpenUserDialog(false)} /></DialogContent>
      </Dialog>

      {selectedUserId && <CustomerDetailsModal open={openDetailsModal} onClose={() => setOpenDetailsModal(false)} userId={selectedUserId} />}
      {selectedUserForManager && <ManagerDialog open={openManagerDialog} onClose={() => setOpenManagerDialog(false)} users={users} currentUser={selectedUserForManager} onSetManager={handleSetManager} />}
    </Box>
  );
};

export default AdminPage;