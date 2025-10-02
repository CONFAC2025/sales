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
  useTheme,
  useMediaQuery,
  Card,
  CardContent,
  Link,
} from '@mui/material';
import { getOrganizationTree } from '../services/organizationService';
import type { Department, Team } from '../services/organizationService';
import type { User } from '../types/user';
import type { UserStatus } from '../types/prisma-enums';
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
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
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

  const DesktopView = ({ departmentTeams, departmentUsers }: { departmentTeams: Team[], departmentUsers: User[] }) => (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>팀</TableCell>
            <TableCell>ID</TableCell>
            <TableCell>이름</TableCell>
            <TableCell>직급</TableCell>
            <TableCell>연락처</TableCell>
            <TableCell>상태</TableCell>
            <TableCell>고객등록수</TableCell>
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
                      <TableCell rowSpan={teamMembers.length}>{team.name}</TableCell>
                    )}
                    <TableCell>{member.userId}</TableCell>
                    <TableCell>{member.name}</TableCell>
                    <TableCell>{translateUserType(member.userType)}</TableCell>
                    <TableCell><Link href={`tel:${member.phone}`}>{member.phone}</Link></TableCell>
                    <TableCell>{getStatusChip(member.status)}</TableCell>
                    <TableCell>{member._count?.registeredCustomers || 0}</TableCell>
                  </TableRow>
                ))}
              </React.Fragment>
            );
          })}
          {departmentUsers.filter(u => !u.teamId).map((member, memberIndex) => (
            <TableRow key={member.id}>
              {memberIndex === 0 && (
                <TableCell rowSpan={departmentUsers.filter(u => !u.teamId).length}>팀 미지정</TableCell>
              )}
              <TableCell>{member.userId}</TableCell>
              <TableCell>{member.name}</TableCell>
              <TableCell>{translateUserType(member.userType)}</TableCell>
              <TableCell><Link href={`tel:${member.phone}`}>{member.phone}</Link></TableCell>
              <TableCell>{getStatusChip(member.status)}</TableCell>
              <TableCell>{member._count?.registeredCustomers || 0}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );

  const MobileView = ({ departmentTeams, departmentUsers }: { departmentTeams: Team[], departmentUsers: User[] }) => (
    <Box>
      {departmentTeams.map((team) => {
        const teamMembers = departmentUsers.filter(u => u.teamId === team.id);
        if (teamMembers.length === 0) return null;
        return (
          <Card key={team.id} sx={{ mb: 2 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>{team.name}</Typography>
              {teamMembers.map(member => (
                <Box key={member.id} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #eee', py: 1}}>
                  <Box>
                    <Typography variant="body1">{member.name} ({member.userId})</Typography>
                    <Typography variant="body2" color="text.secondary">{translateUserType(member.userType)}</Typography>
                    <Link href={`tel:${member.phone}`} variant="body2">{member.phone}</Link>
                  </Box>
                  {getStatusChip(member.status)}
                </Box>
              ))}
            </CardContent>
          </Card>
        );
      })}
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>팀 미지정</Typography>
          {departmentUsers.filter(u => !u.teamId).map(member => (
            <Box key={member.id} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #eee', py: 1}}>
              <Box>
                <Typography variant="body1">{member.name} ({member.userId})</Typography>
                <Typography variant="body2" color="text.secondary">{translateUserType(member.userType)}</Typography>
                <Link href={`tel:${member.phone}`} variant="body2">{member.phone}</Link>
              </Box>
              {getStatusChip(member.status)}
            </Box>
          ))}
        </CardContent>
      </Card>
    </Box>
  );

  return (
    <Box sx={{ width: '100%' }}>
      <Typography variant="h4" gutterBottom sx={{ p: 3 }}>
        조직 관리
      </Typography>
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={selectedTab} onChange={handleChange} aria-label="department tabs" variant={isMobile ? "scrollable" : "standard"} allowScrollButtonsMobile>
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
            {isMobile ? 
              <MobileView departmentTeams={departmentTeams} departmentUsers={departmentUsers} /> : 
              <DesktopView departmentTeams={departmentTeams} departmentUsers={departmentUsers} />
            }
          </TabPanel>
        );
      })}
    </Box>
  );
};

export default OrganizationPage;
