import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { GridLegacy as Grid, Paper, Typography, Box, Button, TextField, IconButton } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import { getCustomers } from '../services/customerService';
import { getUsersForAdmin } from '../services/adminService';
import { updateSiteSettings } from '../services/siteSettingsService';
import type { Customer, CustomerStatus } from '../types/customer';
import type { UserForAdminResponse } from '../types/admin';
import BulletinBoard from '../components/BulletinBoard/BulletinBoard';
import FileLibrary from '../components/FileLibrary/FileLibrary';
import { useSiteSettings } from '../contexts/SiteSettingsContext';
import { getFullUrl } from '../utils/url';
import toast from 'react-hot-toast';
import { useSearchParams } from 'react-router-dom';

const StatCard: React.FC<{ title: string; value: string | number }> = ({ title, value }) => (
  <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column', height: 140 }}>
    <Typography component="h2" variant="h6" color="primary" gutterBottom>
      {title}
    </Typography>
    <Typography component="p" variant="h4">
      {value}
    </Typography>
  </Paper>
);

const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const { settings, refetch } = useSiteSettings();
  const [searchParams] = useSearchParams();
  const postIdToExpand = searchParams.get('postId');

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [users, setUsers] = useState<UserForAdminResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditingBottomBanner, setIsEditingBottomBanner] = useState(false);
  const [bottomBannerLink, setBottomBannerLink] = useState(settings?.bottomBannerLink || '');
  const [bottomBannerFile, setBottomBannerFile] = useState<File | null>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  const isAdmin = user?.userType === 'ADMIN_STAFF';

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const customerData = await getCustomers();
        setCustomers(customerData);

        if (isAdmin) {
          const userData = await getUsersForAdmin({});
          setUsers(userData);
        }
      } catch (error) {
        console.error("Failed to fetch dashboard data", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [isAdmin]);

  useEffect(() => {
    setBottomBannerLink(settings?.bottomBannerLink || '');
  }, [settings]);

  const handleTopBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const formData = new FormData();
      formData.append('bannerUrl', e.target.files[0]);
      try {
        await updateSiteSettings(formData);
        toast.success('Banner updated successfully');
        refetch();
      } catch (error) {
        toast.error('Banner update failed');
      }
    }
  };

  const handleRemoveTopBanner = async () => {
    const formData = new FormData();
    formData.append('bannerUrl', '');
    try {
      await updateSiteSettings(formData);
      toast.success('Banner removed successfully');
      refetch();
    } catch (error) {
      toast.error('Failed to remove banner');
    }
  };

  const handleSaveBottomBanner = async () => {
    const formData = new FormData();
    if (bottomBannerFile) {
      formData.append('bottomBannerUrl', bottomBannerFile);
    }
    formData.append('bottomBannerLink', bottomBannerLink);
    try {
      await updateSiteSettings(formData);
      toast.success('Bottom banner updated successfully');
      refetch();
      setIsEditingBottomBanner(false);
    } catch (error) {
      toast.error('Bottom banner update failed');
    }
  };

  const handleRemoveBottomBanner = async () => {
    const formData = new FormData();
    formData.append('bottomBannerUrl', '');
    formData.append('bottomBannerLink', '');
    try {
      await updateSiteSettings(formData);
      toast.success('Bottom banner removed successfully');
      refetch();
    } catch (error) {
      toast.error('Failed to remove bottom banner');
    }
  };

  const totalCustomers = customers.length;
  const contractedCustomers = customers.filter(c => c.status === 'CONTRACTED').length;
  const totalUsers = users?.length || 0;
  const pendingUsers = users?.filter(u => u.status === 'PENDING').length || 0;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <Box sx={{ width: '100%', maxWidth: 1200 }}>
        <Box sx={{ position: 'relative', mb: 3 }}>
          {settings?.bannerUrl && <img src={getFullUrl(settings.bannerUrl)} alt="banner" style={{ width: '100%', maxHeight: '200px', objectFit: 'cover' }} />}
          {isAdmin && (
            <Box sx={{ position: 'absolute', top: 8, right: 8 }}>
              <Button 
                variant="contained" 
                size="small" 
                onClick={() => bannerInputRef.current?.click()}
              >
                배너 변경
              </Button>
              <Button 
                variant="outlined" 
                size="small" 
                color="error"
                sx={{ ml: 1 }}
                onClick={handleRemoveTopBanner}
              >
                삭제
              </Button>
            </Box>
          )}
          <input type="file" hidden ref={bannerInputRef} onChange={handleTopBannerUpload} />
        </Box>

        <Typography variant="h4" gutterBottom sx={{ mb: 2 }}>
          {user?.name}님, 환영합니다!
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6} md={3}><StatCard title="총 고객 수" value={totalCustomers} /></Grid>
          <Grid item xs={12} sm={6} md={3}><StatCard title="계약 고객 수" value={contractedCustomers} /></Grid>
          
          {isAdmin && (
            <>
              <Grid item xs={12} sm={6} md={3}><StatCard title="총 사용자 수" value={totalUsers} /></Grid>
              <Grid item xs={12} sm={6} md={3}><StatCard title="승인 대기" value={pendingUsers} /></Grid>
            </>
          )}

        </Grid>

        <Grid container spacing={3} sx={{ mt: 2 }}>
          <Grid item xs={12} md={6}>
            <BulletinBoard postIdToExpand={postIdToExpand} />
          </Grid>
          <Grid item xs={12} md={6}>
            <FileLibrary />
          </Grid>
        </Grid>

        <Paper sx={{ p: 2, mt: 3, position: 'relative' }}>
          {isAdmin && !isEditingBottomBanner && (
            <IconButton size="small" sx={{ position: 'absolute', top: 8, right: 8 }} onClick={() => setIsEditingBottomBanner(true)}>
              <EditIcon fontSize="small" />
            </IconButton>
          )}
          {isEditingBottomBanner ? (
            <Box>
              <TextField
                label="배너 링크"
                value={bottomBannerLink}
                onChange={(e) => setBottomBannerLink(e.target.value)}
                fullWidth
                margin="normal"
              />
              <Button variant="contained" component="label" fullWidth sx={{ mt: 1 }}>
                하단 배너 업로드
                <input type="file" hidden onChange={(e) => setBottomBannerFile(e.target.files ? e.target.files[0] : null)} />
              </Button>
              {bottomBannerFile && <Typography variant="body2">{bottomBannerFile.name}</Typography>}
              <Button onClick={handleSaveBottomBanner} sx={{ mt: 1 }}>저장</Button>
              <Button onClick={() => setIsEditingBottomBanner(false)} sx={{ mt: 1 }}>취소</Button>
              <Button onClick={handleRemoveBottomBanner} color="error" sx={{ mt: 1 }}>삭제</Button>
            </Box>
          ) : (
            <a href={settings?.bottomBannerLink || '#'} target="_blank" rel="noopener noreferrer">
              {settings?.bottomBannerUrl ? (
                <img src={getFullUrl(settings.bottomBannerUrl)} alt="bottom banner" style={{ width: '100%' }} />
              ) : (
                <Typography variant="body1">하단 배너를 설정하세요.</Typography>
              )}
            </a>
          )}
        </Paper>
      </Box>
    </Box>
  );
};

export default DashboardPage;