import React, { useState, useEffect } from 'react';
import { Box, Typography, Button, GridLegacy as Grid } from '@mui/material';
import { getResources } from '../../services/resourceService';
import type { Resource } from '../../services/resourceService';
import ResourceCard from './ResourceCard';
import UploadResourceDialog from './UploadResourceDialog';
import { useAuth } from '../../contexts/AuthContext';

const FileLibrary: React.FC = () => {
  const [resources, setResources] = useState<Resource[]>([]);
  const [openUpload, setOpenUpload] = useState(false);
  const { user } = useAuth();

  const fetchResources = () => {
    getResources()
      .then(setResources)
      .catch(console.error);
  };

  useEffect(() => {
    fetchResources();
  }, []);

  const isAdmin = user?.userType === 'ADMIN_STAFF';

  return (
    <Box sx={{ mt: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h5">자료실</Typography>
        {isAdmin && (
          <Button variant="contained" onClick={() => setOpenUpload(true)}>
            자료 업로드
          </Button>
        )}
      </Box>
      <Grid container spacing={2}>
        {resources.map((resource) => (
          <Grid xs={12} sm={6} md={4} key={resource.id}>
            <ResourceCard resource={resource} onResourceDeleted={fetchResources} />
          </Grid>
        ))}
      </Grid>
      <UploadResourceDialog
        open={openUpload}
        onClose={() => setOpenUpload(false)}
        onResourceUploaded={fetchResources}
      />
    </Box>
  );
};

export default FileLibrary;
