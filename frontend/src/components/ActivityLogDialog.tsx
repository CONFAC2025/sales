import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  List,
  ListItem,
  ListItemText,
  CircularProgress,
  Box,
  Typography,
  Divider,
} from '@mui/material';
import { getLogsForEntity, ActivityLog } from '../services/activityLogService';
import { getUsersForAdmin } from '../services/adminService';
import { getDepartments, getTeams } from '../services/organizationService';
import type { UserForAdminResponse } from '../types/admin';
import type { Department, Team } from '../services/organizationService';
import { translateUserType, translateCustomerStatus, translatePotentialLevel } from '../utils/user';

interface ActivityLogDialogProps {
  open: boolean;
  onClose: () => void;
  entityType: string;
  entityId: string;
  entityName: string;
}

// Helper function to format the details of a log entry into a human-readable string.
const formatLogDetails = (log: ActivityLog, users: UserForAdminResponse[], teams: Team[], departments: Department[]) => {
  if (!log.details) return null;

  const details = Array.isArray(log.details) ? log.details : [log.details];

  return details.map((detail, index) => {
    if (detail.message) {
      return <Typography key={index} variant="body2" color="text.secondary">- {detail.message}</Typography>;
    }

    let fromValue = detail.from;
    let toValue = detail.to;

    switch (detail.field) {
      case 'status':
        if (log.entityType === 'USER') {
          // Assuming a translator for user status exists or we can create one.
          fromValue = fromValue || '없음';
          toValue = toValue || '없음';
        } else if (log.entityType === 'CUSTOMER') {
          fromValue = translateCustomerStatus(fromValue);
          toValue = translateCustomerStatus(toValue);
        }
        return <Typography key={index} variant="body2" color="text.secondary">- 상태를 '{fromValue}'에서 '{toValue}'(으)로 변경</Typography>;

      case 'teamId':
        fromValue = teams.find(t => t.id === fromValue)?.name || '미지정';
        toValue = teams.find(t => t.id === toValue)?.name || '미지정';
        return <Typography key={index} variant="body2" color="text.secondary">- 팀을 '{fromValue}'에서 '{toValue}'(으)로 변경</Typography>;

      case 'departmentId':
        fromValue = departments.find(d => d.id === fromValue)?.name || '미지정';
        toValue = departments.find(d => d.id === toValue)?.name || '미지정';
        return <Typography key={index} variant="body2" color="text.secondary">- 부서를 '{fromValue}'에서 '{toValue}'(으)로 변경</Typography>;

      case 'userType':
        fromValue = translateUserType(fromValue);
        toValue = translateUserType(toValue);
        return <Typography key={index} variant="body2" color="text.secondary">- 직급을 '{fromValue}'에서 '{toValue}'(으)로 변경</Typography>;

      case 'potential':
        fromValue = translatePotentialLevel(fromValue);
        toValue = translatePotentialLevel(toValue);
        return <Typography key={index} variant="body2" color="text.secondary">- 고객 성향을 '{fromValue}'에서 '{toValue}'(으)로 변경</Typography>;

      default:
        return (
          <Typography key={index} variant="body2" color="text.secondary">
            - {detail.field} 필드를 '{String(fromValue)}'에서 '{String(toValue)}'(으)로 변경
          </Typography>
        );
    }
  });
};

const ActivityLogDialog: React.FC<ActivityLogDialogProps> = ({ open, onClose, entityType, entityId, entityName }) => {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [users, setUsers] = useState<UserForAdminResponse[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && entityId) {
      setLoading(true);
      Promise.all([
        getLogsForEntity(entityType, entityId),
        getUsersForAdmin({}),
        getDepartments(),
        getTeams(),
      ]).then(([fetchedLogs, fetchedUsers, fetchedDepartments, fetchedTeams]) => {
        setLogs(fetchedLogs);
        setUsers(fetchedUsers);
        setDepartments(fetchedDepartments);
        setTeams(fetchedTeams);
      }).catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [open, entityType, entityId]);

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>
        변경 이력: {entityName}
      </DialogTitle>
      <DialogContent dividers>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : logs.length === 0 ? (
          <Typography sx={{ p: 2, textAlign: 'center' }}>변경 이력이 없습니다.</Typography>
        ) : (
          <List>
            {logs.map((log, index) => (
              <React.Fragment key={log.id}>
                <ListItem alignItems="flex-start">
                  <ListItemText
                    primary={`${log.userName}님이 ${log.action === 'UPDATE' ? '수정' : log.action === 'CREATE' ? '생성' : '작업'}했습니다.`}
                    secondary={
                      <>
                        <Typography component="span" variant="body2" color="text.primary">
                          {new Date(log.timestamp).toLocaleString()}
                        </Typography>
                        {formatLogDetails(log, users, teams, departments)}
                      </>
                    }
                  />
                </ListItem>
                {index < logs.length - 1 && <Divider variant="inset" component="li" />}
              </React.Fragment>
            ))}
          </List>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ActivityLogDialog;