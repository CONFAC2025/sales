import React, { useEffect, useState } from 'react';
import {
  Box,
  AppBar,
  Toolbar,
  Typography,
  CssBaseline,
  Button,
  Tabs,
  Tab,
  Paper,
  Badge,
  IconButton,
  Popover,
  TextField,
  useTheme,
  useMediaQuery,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Divider,
  Chip,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import NotificationsIcon from '@mui/icons-material/Notifications';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import { useChat } from '../contexts/ChatContext';
import { useSiteSettings } from '../contexts/SiteSettingsContext';
import { useNotifications } from '../contexts/NotificationContext';
import { updateSiteSettings } from '../services/siteSettingsService';
import { getFullUrl } from '../utils/url';
import toast from 'react-hot-toast';

function a11yProps(index: string) {
  return {
    id: `simple-tab-${index}`,
    'aria-controls': `simple-tabpanel-${index}`,
  };
}

const Layout: React.FC = () => {
  const { user, logout } = useAuth();
  const { totalUnreadCount } = useChat();
  const { settings, refetch } = useSiteSettings();
  const { notifications, unreadCount, markNotificationAsRead } = useNotifications();
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);
  const [notificationAnchorEl, setNotificationAnchorEl] = useState<HTMLButtonElement | null>(null);
  const [topText, setTopText] = useState(settings?.topText || '');
  const [logoFile, setLogoFile] = useState<File | null>(null);

  useEffect(() => {
    setTopText(settings?.topText || '');
  }, [settings]);

  const handleEditClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleNotificationClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setNotificationAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleNotificationClose = () => {
    setNotificationAnchorEl(null);
  };

  const handleSave = async () => {
    const formData = new FormData();
    if (logoFile) {
      formData.append('logoUrl', logoFile);
    }
    formData.append('topText', topText);
    try {
      await updateSiteSettings(formData);
      toast.success('Updated successfully');
      refetch();
      handleClose();
    } catch (error) {
      toast.error('Update failed');
    }
  };

  const handleRemoveLogo = async () => {
    const formData = new FormData();
    formData.append('logoUrl', '');
    try {
      await updateSiteSettings(formData);
      toast.success('Logo removed successfully');
      refetch();
      handleClose();
    } catch (error) {
      toast.error('Failed to remove logo');
    }
  };

  const handleNotificationItemClick = (notificationId: string, link?: string) => {
    markNotificationAsRead(notificationId);
    // Do not close the popover to allow marking multiple as read
    // handleNotificationClose(); 
    if (link) {
      navigate(link);
    }
  };

  const open = Boolean(anchorEl);
  const id = open ? 'edit-popover' : undefined;
  const openNotifications = Boolean(notificationAnchorEl);
  const notificationsId = openNotifications ? 'notifications-popover' : undefined;

  const getCurrentTab = () => {
    const path = location.pathname.split('/')[1];
    if (path === 'admin') return location.pathname;
    if (path === 'customers') return '/customers';
    if (path === 'chat') return '/chat';
    return '/';
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleTabChange = (_event: React.SyntheticEvent, newValue: string) => {
    navigate(newValue);
  };

  const isAdmin = user?.userType === 'ADMIN_STAFF';

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Toaster />
      <CssBaseline />
      <AppBar position="static">
        <Toolbar>
          <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center' }}>
            {settings?.logoUrl ? (
              <img src={getFullUrl(settings.logoUrl)} alt="logo" style={{ height: 40 }} />
            ) : (
              <Typography variant="h6" noWrap component="div">
                {settings?.topText || 'APT Sales'}
              </Typography>
            )}
            {isAdmin && (
              <IconButton size="small" onClick={handleEditClick} sx={{ ml: 1, color: 'white' }}>
                <EditIcon fontSize="small" />
              </IconButton>
            )}
          </Box>
          {!isMobile && <Typography sx={{ mr: 2 }}>{user?.name}님</Typography>}
          <IconButton color="inherit" onClick={handleNotificationClick}>
            <Badge badgeContent={unreadCount} color="error">
              <NotificationsIcon />
            </Badge>
          </IconButton>
          <Button color="inherit" onClick={handleLogout}>로그아웃</Button>
        </Toolbar>
        <Box sx={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
          <Tabs 
            value={getCurrentTab()} 
            onChange={handleTabChange} 
            textColor="inherit" 
            variant={isMobile ? "fullWidth" : "standard"}
            centered
            sx={{
              '& .MuiTab-root': { // Target all Tab components within these Tabs
                minWidth: 'auto',
                p: 1,
              }
            }}
          >
            <Tab 
              label={
                <Badge badgeContent={unreadCount} color="error">
                  <Typography sx={{ fontSize: isMobile ? '0.7rem' : '1.2rem' }}>대시보드</Typography>
                </Badge>
              } 
              value="/" 
              {...a11yProps('dashboard')} 
            />
            <Tab 
              label={
                <Badge badgeContent={unreadCount} color="error">
                  <Typography sx={{ fontSize: isMobile ? '0.7rem' : '1.2rem' }}>고객 관리</Typography>
                </Badge>
              } 
              value="/customers" 
              {...a11yProps('customers')} 
            />
            <Tab 
              label={
                <Badge badgeContent={totalUnreadCount} color="error"> {/* This one is for CHAT only */}
                  <Typography sx={{ fontSize: isMobile ? '0.7rem' : '1.2rem' }}>채팅</Typography>
                </Badge>
              } 
              value="/chat" 
              {...a11yProps('chat')} 
            />
            {isAdmin && <Tab 
              label={
                <Badge badgeContent={unreadCount} color="error">
                  <Typography sx={{ fontSize: isMobile ? '0.7rem' : '1.2rem' }}>사용자 관리</Typography>
                </Badge>
              } 
              value="/admin/users" 
              {...a11yProps('admin-users')} 
            />}
            {isAdmin && <Tab 
              label={
                <Badge badgeContent={unreadCount} color="error">
                  <Typography sx={{ fontSize: isMobile ? '0.7rem' : '1.2rem' }}>조직 관리</Typography>
                </Badge>
              } 
              value="/admin/organization" 
              {...a11yProps('admin-org')} 
            />}
          </Tabs>
        </Box>
      </AppBar>

      <Popover
        id={id}
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
      >
        <Box sx={{ p: 2 }}>
          <Typography sx={{ mb: 2 }}>상단 꾸미기</Typography>
          <TextField
            label="상단 텍스트"
            value={topText}
            onChange={(e) => setTopText(e.target.value)}
            fullWidth
            margin="normal"
          />
          <Button variant="contained" component="label" fullWidth sx={{ mt: 1 }}>
            로고 업로드
            <input type="file" hidden onChange={(e) => setLogoFile(e.target.files ? e.target.files[0] : null)} />
          </Button>
          {logoFile && <Typography variant="body2" sx={{ mt: 1 }}>{logoFile.name}</Typography>}
          <Button onClick={handleRemoveLogo} variant="outlined" color="error" fullWidth sx={{ mt: 1 }}>로고 삭제</Button>
          <Button onClick={handleSave} variant="contained" color="primary" fullWidth sx={{ mt: 2 }}>저장</Button>
        </Box>
      </Popover>

      <Popover
        id={notificationsId}
        open={openNotifications}
        anchorEl={notificationAnchorEl}
        onClose={handleNotificationClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        <Paper sx={{ width: 400, maxWidth: '100%' }}>
          <List>
            {notifications.length === 0 ? (
              <ListItem>
                <ListItemText primary="새로운 알림이 없습니다." />
              </ListItem>
            ) : (
              notifications.map((notification, index) => (
                <React.Fragment key={notification.id}>
                  <ListItem disablePadding>
                    <ListItemButton
                      onClick={() => handleNotificationItemClick(notification.id, notification.link)}
                      sx={{ 
                        backgroundColor: notification.isRead ? 'transparent' : '#f5f5f5',
                        alignItems: 'flex-start'
                      }}
                    >
                      <ListItemText 
                        primaryTypographyProps={{ fontWeight: notification.isRead ? 'normal' : 'bold' }}
                        primary={notification.message} 
                        secondary={new Date(notification.createdAt).toLocaleString()} 
                      />
                      <Chip 
                        label={notification.isRead ? '확인완료' : '확인전'} 
                        color={notification.isRead ? 'default' : 'primary'} 
                        size="small"
                        sx={{ ml: 2, mt: 0.5 }}
                      />
                    </ListItemButton>
                  </ListItem>
                  {index < notifications.length - 1 && <Divider />}
                </React.Fragment>
              ))
            )}
          </List>
        </Paper>
      </Popover>

      <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
        <Outlet />
      </Box>
    </Box>
  );
};

export default Layout;