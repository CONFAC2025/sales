import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  CircularProgress,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
} from '@mui/material';
import { getOrganizationTree } from '../services/organizationService';
import type { Department, Team } from '../services/organizationService';
import type { User } from '../types/user';
import { UserStatus } from '@prisma/client';
import { translateUserType } from '../utils/user';
import toast from 'react-hot-toast';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`department-tabpanel-${index}`}
      aria-labelledby={`department-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const getStatusChip = (status: UserStatus) => {
  const statusMap: Record<UserStatus, React.ReactElement> = {
    APPROVED: <Chip label="승인" color="success" size="small" />,
    PENDING: <Chip label="대기" color="warning" size="small" />,
    REJECTED: <Chip label="거절" color="error" size="small" />,
    SUSPENDED: <Chip label="정지" color="default" size="small" />,
  };
  return statusMap[status] || <Chip label={status} size="small" />;
};

const OrganizationPage: React.FC = () => {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const { departments, teams, users } = await getOrganizationTree();
        setDepartments(departments);
        setTeams(teams);
        setUsers(users);
      } catch (error) {
        console.error('Failed to fetch organization data:', error);
        toast.error('조직 데이터를 불러오는데 실패했습니다.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleChange = (_event: React.SyntheticEvent, newValue: number) => {
    setSelectedTab(newValue);
  };

  if (loading) {
    return <CircularProgress />;
  }

  return (
    <Box sx={{ width: '100%' }}>
      <Typography variant="h4" gutterBottom sx={{ p: 3 }}>
        조직 관리
      </Typography>
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={selectedTab} onChange={handleChange} aria-label="department tabs">
          {departments.map((dept) => (
            <Tab label={dept.name} key={dept.id} />
          ))}
        </Tabs>
      </Box>
      {departments.map((dept, index) => {
        const departmentUsers = users.filter(u => u.departmentId === dept.id);
        const departmentTeams = teams.filter(t => t.departmentId === dept.id);

        return (
          <TabPanel value={selectedTab} index={index} key={dept.id}>
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ p: { xs: 1, sm: 2 } }}>팀</TableCell>
                    <TableCell sx={{ p: { xs: 1, sm: 2 } }}>ID</TableCell>
                    <TableCell sx={{ p: { xs: 1, sm: 2 } }}>이름</TableCell>
                    <TableCell sx={{ p: { xs: 1, sm: 2 } }}>직급</TableCell>
                    <TableCell sx={{ p: { xs: 1, sm: 2 } }}>연락처</TableCell>
                    <TableCell sx={{ p: { xs: 1, sm: 2 } }}>상태</TableCell>
                    <TableCell sx={{ p: { xs: 1, sm: 2 } }}>고객등록수</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {departmentTeams.map((team) => {
                    const teamMembers = departmentUsers.filter(u => u.teamId === team.id);
                    return (
                      <React.Fragment key={team.id}>
                        {teamMembers.map((member, memberIndex) => (
                          <TableRow key={member.id}>
                            {memberIndex === 0 && (
                              <TableCell rowSpan={teamMembers.length} sx={{ p: { xs: 1, sm: 2 } }}>{team.name}</TableCell>
                            )}
                            <TableCell sx={{ p: { xs: 1, sm: 2 } }}>{member.userId}</TableCell>
                            <TableCell sx={{ p: { xs: 1, sm: 2 } }}>{member.name}</TableCell>
                            <TableCell sx={{ p: { xs: 1, sm: 2 } }}>{translateUserType(member.userType)}</TableCell>
                            <TableCell sx={{ p: { xs: 1, sm: 2 } }}>{member.phone}</TableCell>
                            <TableCell sx={{ p: { xs: 1, sm: 2 } }}>{getStatusChip(member.status)}</TableCell>
                            <TableCell sx={{ p: { xs: 1, sm: 2 } }}>{member._count?.registeredCustomers || 0}</TableCell>
                          </TableRow>
                        ))}
                      </React.Fragment>
                    );
                  })}
                  {/* Render users not in any team but in this department */}
                  {departmentUsers.filter(u => !u.teamId).map((member, memberIndex) => (
                    <TableRow key={member.id}>
                      {memberIndex === 0 && (
                        <TableCell rowSpan={departmentUsers.filter(u => !u.teamId).length} sx={{ p: { xs: 1, sm: 2 } }}>팀 미지정</TableCell>
                      )}
                      <TableCell sx={{ p: { xs: 1, sm: 2 } }}>{member.userId}</TableCell>
                      <TableCell sx={{ p: { xs: 1, sm: 2 } }}>{member.name}</TableCell>
                      <TableCell sx={{ p: { xs: 1, sm: 2 } }}>{translateUserType(member.userType)}</TableCell>
                      <TableCell sx={{ p: { xs: 1, sm: 2 } }}>{member.phone}</TableCell>
                      <TableCell sx={{ p: { xs: 1, sm: 2 } }}>{getStatusChip(member.status)}</TableCell>
                      <TableCell sx={{ p: { xs: 1, sm: 2 } }}>{member._count?.registeredCustomers || 0}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </TabPanel>
        );
      })}
    </Box>
  );
};

export default OrganizationPage;
