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
import { getLogsForEntity } from '../services/activityLogService';
import type { ActivityLog } from '../services/activityLogService';

interface ActivityLogDialogProps {
  open: boolean;
  onClose: () => void;
  entityType: string;
  entityId: string;
  entityName: string;
}

const renderDetails = (details: any) => {
  if (Array.isArray(details)) {
    return details.map((d, i) => (
      <Typography key={i} variant="body2" color="text.secondary">
        - 필드: {d.field}, 이전 값: {String(d.from)}, 새 값: {String(d.to)}
      </Typography>
    ));
  } else if (details.message) {
    return <Typography variant="body2" color="text.secondary">- {details.message}</Typography>;
  }
  return <Typography variant="body2" color="text.secondary">- 변경 내역을 확인할 수 없습니다.</Typography>;
};

const ActivityLogDialog: React.FC<ActivityLogDialogProps> = ({ open, onClose, entityType, entityId, entityName }) => {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && entityId) {
      setLoading(true);
      getLogsForEntity(entityType, entityId)
        .then(setLogs)
        .catch(console.error)
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
                    primary={`${log.userName}님이 ${log.action} 작업을 수행했습니다.`}
                    secondary={
                      <>
                        <Typography component="span" variant="body2" color="text.primary">
                          {new Date(log.timestamp).toLocaleString()}
                        </Typography>
                        {renderDetails(log.details)}
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
