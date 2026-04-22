import axios from 'axios';

const api = axios.create({
  // This is your Node.js backend URL
  baseURL: 'http://localhost:5000/api', 
});

// Optional: This automatically attaches your JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;