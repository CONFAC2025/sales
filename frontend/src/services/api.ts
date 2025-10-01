import axios from 'axios';

const api = axios.create({
  baseURL: '/api', // Use relative path to utilize Vite proxy
});

// Add a request interceptor
api.interceptors.request.use(
  (config) => {
    console.log('Interceptor triggered for:', config.url);
    const token = localStorage.getItem('token');
    console.log('Token from localStorage:', token);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('Authorization header set');
    } else {
      console.log('No token found in localStorage');
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;
