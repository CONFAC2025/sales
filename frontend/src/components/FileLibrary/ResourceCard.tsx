import React from 'react';
import { Card, CardContent, CardActions, Typography, Button, IconButton } from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';
import { deleteResource } from '../../services/resourceService';
import type { Resource } from '../../services/resourceService';
import DeleteIcon from '@mui/icons-material/Delete';
import toast from 'react-hot-toast';

interface ResourceCardProps {
  resource: Resource;
  onResourceDeleted: () => void;
}

// Helper function to format file size
const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const ResourceCard: React.FC<ResourceCardProps> = ({ resource, onResourceDeleted }) => {
  const { user } = useAuth();
  const isAdmin = user?.userType === 'ADMIN_STAFF';

  const handleDelete = async () => {
    if (window.confirm(`'${resource.title}' 자료를 정말로 삭제하시겠습니까?`)) {
      try {
        await deleteResource(resource.id);
        toast.success('자료가 삭제되었습니다.');
        onResourceDeleted();
      } catch (error) {
        toast.error('자료 삭제에 실패했습니다.');
        console.error(error);
      }
    }
  };

  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardContent sx={{ flexGrow: 1 }}>
        <Typography gutterBottom variant="h6" component="h2">
          {resource.title}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {resource.description || ''}
        </Typography>
        <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 2 }}>
          {formatFileSize(resource.fileSize)} | {new Date(resource.createdAt).toLocaleDateString()}
        </Typography>
      </CardContent>
      <CardActions>
        <Button 
          size="small" 
          href={`http://localhost:3002${resource.filePath}`}
          download
          target="_blank"
        >
          다운로드
        </Button>
        {isAdmin && (
          <IconButton onClick={handleDelete} size="small" sx={{ ml: 'auto' }}>
            <DeleteIcon />
          </IconButton>
        )}
      </CardActions>
    </Card>
  );
};

export default ResourceCard;
