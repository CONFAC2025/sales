import React, { useEffect, useState, useMemo } from 'react';
import { Typography, Box, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Button, IconButton, Chip, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, TextField, FormControl, InputLabel, Select, MenuItem } from '@mui/material';

import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SendIcon from '@mui/icons-material/Send';
import { getCustomers, deleteCustomer } from '../services/customerService';
import { getUsersForAdmin } from '../services/adminService';
import type { UserForAdminResponse } from '../types/admin';
import { type CustomerStatus, CustomerStatusOptions } from '../types/prisma-enums';
import type { Customer, PotentialLevel } from '../types/customer';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useChat } from '../contexts/ChatContext';
import { useNotifications } from '../contexts/NotificationContext';
import ActivityLogDialog from '../components/ActivityLogDialog';

const translateStatusToKorean = (status: CustomerStatus) => {
  switch (status) {
    case 'REGISTERED': return '등록';
    case 'VISITED': return '방문';
    case 'CONSULTED': return '상담';
    case 'CONTRACTED': return '계약';
    case 'CANCELLED': return '취소';
    default: return status;
  }
};

const translatePotentialToKorean = (potential: PotentialLevel) => {
  switch (potential) {
    case 'HIGH': return '상';
    case 'MEDIUM': return '중';
    case 'LOW': return '하';
    default: return potential;
  }
};

const CustomersPage: React.FC = () => {
  const navigate = useNavigate();
  const { user: currentUser, isAuthenticated } = useAuth();
  const { sendSystemMessageToUser } = useChat();
  const { notifications, markAsReadByLink } = useNotifications();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [users, setUsers] = useState<UserForAdminResponse[]>([]);
  
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [logDialogOpen, setLogDialogOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  // Filter states
  const [filterSource, setFilterSource] = useState('');
  const [filterPotential, setFilterPotential] = useState<PotentialLevel | '' >('');
  const [filterStatus, setFilterStatus] = useState<CustomerStatus | '' >('');
  const [filterRegisteredByName, setFilterRegisteredByName] = useState('');
  const [filterRegistrationDateStart, setFilterRegistrationDateStart] = useState('');
  const [filterRegistrationDateEnd, setFilterRegistrationDateEnd] = useState('');

  const unreadCustomerUpdates = useMemo(() => {
    const updateMap = new Map<string, string>();
    notifications
      .filter(n => !n.isRead && typeof n.link === 'string' && n.link.startsWith('/customers/'))
      .forEach(n => {
        if (n.link) {
          // Keep only the latest notification message for each link
          if (!updateMap.has(n.link)) {
            updateMap.set(n.link, n.message);
          }
        }
      });
    return updateMap;
  }, [notifications]);

  const fetchInitialData = async () => {
    if (!isAuthenticated) return;
    try {
      const [fetchedCustomers, fetchedUsers] = await Promise.all([
        getCustomers(),
        getUsersForAdmin({}),
      ]);
      setCustomers(fetchedCustomers);
      setUsers(fetchedUsers);
    } catch (err) {
      
      console.error(err);
    }
  };

  const fetchCustomers = async () => {
    if (!isAuthenticated) return;
    try {
      const filters = {
        source: filterSource || undefined,
        potential: filterPotential || undefined,
        status: filterStatus || undefined,
        registeredByName: filterRegisteredByName || undefined,
        registrationDateStart: filterRegistrationDateStart ? new Date(filterRegistrationDateStart) : undefined,
        registrationDateEnd: filterRegistrationDateEnd ? new Date(filterRegistrationDateEnd) : undefined,
      };
      const fetchedCustomers = await getCustomers(filters);
      setCustomers(fetchedCustomers);
    } catch (err) {
      
      console.error(err);
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, [isAuthenticated]);

  const uniqueSources = useMemo(() => 
    customers ? [...new Set(customers.map(c => c.source).filter(Boolean))] as string[] : [], 
    [customers]
  );

  const handleEdit = (id: string) => {
    markAsReadByLink(`/customers/${id}`);
    navigate(`/customers/${id}/edit`);
  };

  const handleRowClick = (customer: Customer) => {
    setSelectedCustomer(customer);
    setLogDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    setSelectedCustomerId(id);
    setOpenDeleteDialog(true);
  };

  const handleSendMessage = (customer: Customer) => {
    if (!customer.registeredById) return;
    const message = `[자동 메시지] '${customer.name}' 고객님 건에 대해 확인 요청드립니다.`;
    sendSystemMessageToUser(customer.registeredById, message);
  };

  const confirmDelete = async () => {
    if (selectedCustomerId) {
      try {
        await deleteCustomer(selectedCustomerId);
        fetchCustomers();
      } catch (err) {
        
      } finally {
        setOpenDeleteDialog(false);
        setSelectedCustomerId(null);
      }
    }
  };

  const getStatusChip = (status: CustomerStatus) => {
    const koreanStatus = translateStatusToKorean(status);
    switch (status) {
      case 'REGISTERED': return <Chip label={koreanStatus} color="primary" size="small" />;
      case 'VISITED': return <Chip label={koreanStatus} color="info" size="small" />;
      case 'CONSULTED': return <Chip label={koreanStatus} color="secondary" size="small" />;
      case 'CONTRACTED': return <Chip label={koreanStatus} color="success" size="small" />;
      case 'CANCELLED': return <Chip label={koreanStatus} color="error" size="small" />;
      default: return <Chip label={koreanStatus} size="small" />;
    }
  };

  const getPotentialChip = (potential: PotentialLevel | null) => {
    if (!potential) return '-';
    const koreanPotential = translatePotentialToKorean(potential);
    switch (potential) {
      case 'HIGH': return <Chip label={koreanPotential} color="error" size="small" />;
      case 'MEDIUM': return <Chip label={koreanPotential} color="warning" size="small" />;
      case 'LOW': return <Chip label={koreanPotential} color="success" size="small" />;
      default: return '-';
    }
  };

  const canSendMessage = currentUser?.userType === 'ADMIN_STAFF' || currentUser?.userType === 'DEPARTMENT_MANAGER' || currentUser?.userType === 'TEAM_LEADER';

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h4" gutterBottom>고객 관리</Typography>
        <Button variant="contained" onClick={() => navigate('/customers/new')}>신규 고객 등록</Button>
      </Box>

      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" gutterBottom>필터</Typography>
        <Box sx={{ display: 'flex', justifyContent: 'center' }}>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center' }}>
            <FormControl sx={{ minWidth: 150 }} size="small">
              <InputLabel>유입 경로</InputLabel>
              <Select value={filterSource} label="유입 경로" onChange={(e) => setFilterSource(e.target.value)}>
                <MenuItem value=""><em>전체</em></MenuItem>
                {uniqueSources.map(source => <MenuItem key={source} value={source}>{source}</MenuItem>)}
              </Select>
            </FormControl>
            <FormControl sx={{ minWidth: 120 }} size="small">
              <InputLabel>성향</InputLabel>
              <Select value={filterPotential} label="성향" onChange={(e) => setFilterPotential(e.target.value as PotentialLevel)}>
                <MenuItem value=""><em>전체</em></MenuItem>
                <MenuItem value="HIGH">상</MenuItem>
                <MenuItem value="MEDIUM">중</MenuItem>
                <MenuItem value="LOW">하</MenuItem>
              </Select>
            </FormControl>
            <FormControl sx={{ minWidth: 120 }} size="small">
              <InputLabel>상태</InputLabel>
              <Select value={filterStatus} label="상태" onChange={(e) => setFilterStatus(e.target.value as CustomerStatus)}>
                <MenuItem value=""><em>전체</em></MenuItem>
                {CustomerStatusOptions.map(s => <MenuItem key={s} value={s}>{translateStatusToKorean(s)}</MenuItem>)}
              </Select>
            </FormControl>
            <FormControl sx={{ minWidth: 150 }} size="small">
              <InputLabel>등록자 이름</InputLabel>
              <Select value={filterRegisteredByName} label="등록자 이름" onChange={(e) => setFilterRegisteredByName(e.target.value)}>
                <MenuItem value=""><em>전체</em></MenuItem>
                {users.map(user => <MenuItem key={user.id} value={user.name}>{user.name}</MenuItem>)}
              </Select>
            </FormControl>
            <TextField label="등록일 시작" type="date" size="small" InputLabelProps={{ shrink: true }} value={filterRegistrationDateStart} onChange={(e) => setFilterRegistrationDateStart(e.target.value)} />
            <TextField label="등록일 종료" type="date" size="small" InputLabelProps={{ shrink: true }} value={filterRegistrationDateEnd} onChange={(e) => setFilterRegistrationDateEnd(e.target.value)} />
            <Button variant="contained" onClick={fetchCustomers}>검색</Button>
          </Box>
        </Box>
      </Paper>

      <TableContainer component={Paper}>
        <Table sx={{ minWidth: 650 }} aria-label="customer table">
          <TableHead>
            <TableRow>
              <TableCell>이름</TableCell>
              <TableCell>연락처</TableCell>
              <TableCell>관심 물건</TableCell>
              <TableCell>유입 경로</TableCell>
              <TableCell>성향</TableCell>
              <TableCell>상태</TableCell>
              <TableCell>등록일</TableCell>
              <TableCell>등록자</TableCell>
              <TableCell align="right">작업</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {customers && customers.map((customer) => (
              <TableRow 
                key={customer.id}
                hover
                sx={{ cursor: 'pointer' }}
                onClick={() => handleRowClick(customer)}
              >
                <TableCell>
                  <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                    <Typography component="span">{customer.name}</Typography>
                    {unreadCustomerUpdates.has(`/customers/${customer.id}`) && (
                      <Typography variant="caption" color="secondary.main">
                        {unreadCustomerUpdates.get(`/customers/${customer.id}`)}
                      </Typography>
                    )}
                  </Box>
                </TableCell>
                <TableCell>{customer.phone}</TableCell>
                <TableCell>{customer.interestedProperty || '-'}</TableCell>
                <TableCell>{customer.source || '-'}</TableCell>
                <TableCell>{getPotentialChip(customer.potential)}</TableCell>
                <TableCell>{getStatusChip(customer.status)}</TableCell>
                <TableCell>{new Date(customer.createdAt).toLocaleDateString()}</TableCell>
                <TableCell>{customer.registeredBy?.name}</TableCell>
                <TableCell align="right" onClick={(e) => e.stopPropagation()}>
                  {canSendMessage && customer.registeredById && customer.registeredById !== currentUser?.id && (
                    <IconButton onClick={() => handleSendMessage(customer)} size="small">
                      <SendIcon />
                    </IconButton>
                  )}
                  <IconButton onClick={() => handleEdit(customer.id)} size="small"><EditIcon /></IconButton>
                  <IconButton onClick={() => handleDelete(customer.id)} size="small"><DeleteIcon /></IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {selectedCustomer && (
        <ActivityLogDialog
          open={logDialogOpen}
          onClose={() => setLogDialogOpen(false)}
          entityType="CUSTOMER"
          entityId={selectedCustomer.id}
          entityName={selectedCustomer.name}
        />
      )}

      <Dialog open={openDeleteDialog} onClose={() => setOpenDeleteDialog(false)}>
        <DialogTitle>고객 삭제 확인</DialogTitle>
        <DialogContent><DialogContentText>정말로 이 고객 정보를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.</DialogContentText></DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDeleteDialog(false)}>취소</Button>
          <Button onClick={confirmDelete} color="error">삭제</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CustomersPage;