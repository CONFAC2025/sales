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
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  TableSortLabel,
  useTheme,
  useMediaQuery,
  Card,
  CardContent,
  CardActions,
  Link,
} from '@mui/material';

import ChatIcon from '@mui/icons-material/Chat';

import { getUsersForAdmin, updateUserStatus, createUser, updateUserType, assignOrg, setUserManager } from '../services/adminService';
import { getDepartments, getTeams } from '../services/organizationService';
import type { Department, Team } from '../services/organizationService';
import { UserTypeOptions } from '../types/prisma-enums';
import type { UserStatus, UserType } from '../types/prisma-enums';
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
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [users, setUsers] = useState<UserForAdminResponse[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  
  const [openUserDialog, setOpenUserDialog] = useState(false);
  const [openDetailsModal, setOpenDetailsModal] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [openManagerDialog, setOpenManagerDialog] = useState(false);
  const [selectedUserForManager, _setSelectedUserForManager] = useState<UserForAdminResponse | null>(null);
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
    const statusMap: Record<UserStatus, React.ReactElement> = {
      APPROVED: <Chip label="승인" color="success" size="small" />,
      PENDING: <Chip label="대기" color="warning" size="small" />,
      REJECTED: <Chip label="거절" color="error" size="small" />,
      SUSPENDED: <Chip label="정지" color="default" size="small" />,
    };
    return statusMap[status] || <Chip label={status} size="small" />;
  };

  const DesktopView = () => (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>아이디</TableCell>
            <TableCell>이름</TableCell>
            <TableCell>연락처</TableCell>
            <TableCell>직급</TableCell>
            <TableCell>부서(본부)</TableCell>
            <TableCell>팀</TableCell>
            <TableCell>상태</TableCell>
            <TableCell>고객등록수</TableCell>
            <TableCell align="right">작업</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {users.map((user) => (
            <TableRow key={user.id} hover sx={{ cursor: 'pointer' }} onClick={() => handleRowClick(user)}>
              <TableCell>{user.userId}</TableCell>
              <TableCell>{user.name}</TableCell>
              <TableCell><Link href={`tel:${user.phone}`} onClick={(e) => e.stopPropagation()}>{user.phone}</Link></TableCell>
              <TableCell onClick={(e) => e.stopPropagation()}>
                <FormControl size="small" sx={{ minWidth: 120 }}>
                  <Select value={user.userType} onChange={(e) => handleUserTypeChange(user.id, e.target.value as UserType)}>
                    {UserTypeOptions.map((type) => (<MenuItem key={type} value={type}>{translateUserType(type)}</MenuItem>))}
                  </Select>
                </FormControl>
              </TableCell>
              <TableCell onClick={(e) => e.stopPropagation()}>
                 <FormControl size="small" sx={{ minWidth: 120 }}>
                    <Select value={user.departmentId || ''} onChange={(e) => handleOrgChange(user.id, e.target.value, null)}>
                      <MenuItem value=""><em>미지정</em></MenuItem>
                      {departments.map((dept) => (<MenuItem key={dept.id} value={dept.id}>{dept.name}</MenuItem>))}
                    </Select>
                  </FormControl>
              </TableCell>
              <TableCell onClick={(e) => e.stopPropagation()}>
                <FormControl size="small" sx={{ minWidth: 120 }}>
                  <Select value={user.teamId || ''} onChange={(e) => handleOrgChange(user.id, user.departmentId || null, e.target.value)} disabled={!user.departmentId}>
                    <MenuItem value=""><em>미지정</em></MenuItem>
                    {teams.filter(team => team.departmentId === user.departmentId).map((team) => (<MenuItem key={team.id} value={team.id}>{team.name}</MenuItem>))}
                  </Select>
                </FormControl>
              </TableCell>
              <TableCell onClick={(e) => e.stopPropagation()}>
                <FormControl size="small" sx={{ minWidth: 100 }}>
                  <Select value={user.status} onChange={(e) => handleStatusChange(user.id, e.target.value as UserStatus)} renderValue={(s) => getStatusChip(s)}>
                    <MenuItem value="PENDING">대기</MenuItem>
                    <MenuItem value="APPROVED">승인</MenuItem>
                    <MenuItem value="REJECTED">거절</MenuItem>
                    <MenuItem value="SUSPENDED">정지</MenuItem>
                  </Select>
                </FormControl>
              </TableCell>
              <TableCell onClick={(e) => e.stopPropagation()}>
                <Button size="small" onClick={() => { setSelectedUserId(user.id); setOpenDetailsModal(true); }}>{user.registeredCustomersCount}</Button>
              </TableCell>
              <TableCell align="right" onClick={(e) => e.stopPropagation()}>
                <IconButton size="small" onClick={() => startOneOnOneChat(user.id)}><ChatIcon /></IconButton>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );

  const MobileView = () => (
    <Box>
      {users.map((user) => (
        <Card key={user.id} sx={{ mb: 2 }}>
          <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }} onClick={() => handleRowClick(user)}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>{user.name} ({user.userId})</Typography>
                <Link href={`tel:${user.phone}`} onClick={(e) => e.stopPropagation()}>{user.phone}</Link>
              </Box>
              <FormControl size="small" sx={{ minWidth: 100 }} onClick={(e) => e.stopPropagation()}>
                <Select value={user.status} onChange={(e) => handleStatusChange(user.id, e.target.value as UserStatus)} renderValue={(s) => getStatusChip(s)}>
                  <MenuItem value="PENDING">대기</MenuItem>
                  <MenuItem value="APPROVED">승인</MenuItem>
                  <MenuItem value="REJECTED">거절</MenuItem>
                  <MenuItem value="SUSPENDED">정지</MenuItem>
                </Select>
              </FormControl>
            </Box>
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr', gap: 1, mt: 2 }} onClick={(e) => e.stopPropagation()}>
              <FormControl fullWidth size="small">
                <Select value={user.userType} onChange={(e) => handleUserTypeChange(user.id, e.target.value as UserType)} displayEmpty>
                  {UserTypeOptions.map((type) => (<MenuItem key={type} value={type}>{translateUserType(type)}</MenuItem>))}
                </Select>
              </FormControl>
              <FormControl fullWidth size="small">
                <Select value={user.departmentId || ''} onChange={(e) => handleOrgChange(user.id, e.target.value, null)} displayEmpty>
                  <MenuItem value=""><em>부서 미지정</em></MenuItem>
                  {departments.map((dept) => (<MenuItem key={dept.id} value={dept.id}>{dept.name}</MenuItem>))}
                </Select>
              </FormControl>
              <FormControl fullWidth size="small" disabled={!user.departmentId}>
                <Select value={user.teamId || ''} onChange={(e) => handleOrgChange(user.id, user.departmentId || null, e.target.value)} displayEmpty>
                  <MenuItem value=""><em>팀 미지정</em></MenuItem>
                  {teams.filter(team => team.departmentId === user.departmentId).map((team) => (<MenuItem key={team.id} value={team.id}>{team.name}</MenuItem>))}
                </Select>
              </FormControl>
            </Box>
          </CardContent>
          <CardActions sx={{ justifyContent: 'space-between', pt: 0 }}>
            <Button size="small" onClick={(e) => { e.stopPropagation(); setSelectedUserId(user.id); setOpenDetailsModal(true); }}>
              등록고객: {user.registeredCustomersCount}
            </Button>
            <IconButton size="small" onClick={(e) => { e.stopPropagation(); startOneOnOneChat(user.id); }}><ChatIcon /></IconButton>
          </CardActions>
        </Card>
      ))}
    </Box>
  );

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h4" gutterBottom>사용자 관리</Typography>
        <Button variant="contained" onClick={() => setOpenUserDialog(true)}>신규 사용자 등록</Button>
      </Box>

      {isMobile ? <MobileView /> : <DesktopView />}

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