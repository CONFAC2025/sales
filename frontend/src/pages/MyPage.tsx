import React from 'react';
import { Paper, Typography, Box, List, ListItem, ListItemText, Divider } from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import { translateUserType } from '../utils/user';

const MyPage: React.FC = () => {
  const { user } = useAuth();

  if (!user) {
    return <Typography>사용자 정보를 불러오는 중입니다...</Typography>;
  }

  return (
    <Box sx={{ maxWidth: 600, mx: 'auto' }}>
      <Typography variant="h4" gutterBottom>
        내 정보
      </Typography>
      <Paper elevation={3}>
        <List>
          <ListItem>
            <ListItemText primary="이름" secondary={user.name} />
          </ListItem>
          <Divider />
          <ListItem>
            <ListItemText primary="아이디" secondary={user.userId} />
          </ListItem>
          <Divider />
          <ListItem>
            <ListItemText primary="직급" secondary={translateUserType(user.userType)} />
          </ListItem>
          <Divider />
          <ListItem>
            <ListItemText primary="연락처" secondary={user.phone} />
          </ListItem>
          <Divider />
          <ListItem>
            <ListItemText primary="소속 부서" secondary={user.department?.name || '미지정'} />
          </ListItem>
          <Divider />
          <ListItem>
            <ListItemText primary="소속 팀" secondary={user.team?.name || '미지정'} />
          </ListItem>
        </List>
      </Paper>
    </Box>
  );
};

export default MyPage;
