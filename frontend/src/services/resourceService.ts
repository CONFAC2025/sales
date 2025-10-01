import api from './api';

export interface Resource {
  id: string;
  title: string;
  description: string | null;
  filePath: string;
  fileType: string;
  fileSize: number;
  createdAt: string;
  author: {
    name: string;
  };
}

export const getResources = async (): Promise<Resource[]> => {
  const response = await api.get('/resources');
  return response.data.data;
};

export const createResource = async (data: { title: string; description?: string; file: File }): Promise<Resource> => {
  const formData = new FormData();
  formData.append('title', data.title);
  if (data.description) {
    formData.append('description', data.description);
  }
  formData.append('file', data.file);

  const response = await api.post('/resources', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data.data;
};

export const deleteResource = async (id: string): Promise<void> => {
  await api.delete(`/resources/${id}`);
};
