import axios from 'axios';

const baseURL = import.meta.env.VITE_API_BASE_URL;
console.log("VITE_API_BASE_URL at runtime:", baseURL);

const api = axios.create({
  baseURL: baseURL || 'https://sales-ofg0.onrender.com', // 디버깅을 위한 임시 fallback
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
