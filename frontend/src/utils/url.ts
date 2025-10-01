const API_BASE_URL = 'http://localhost:3002';

export const getFullUrl = (path: string): string => {
  if (path.startsWith('/')) {
    return `${API_BASE_URL}${path}`;
  }
  return path;
};
