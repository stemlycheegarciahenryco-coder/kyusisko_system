import axios from 'axios';

// Use LOCAL when in development, Render when in production
const backendURL = import.meta.env.DEV 
  ? (import.meta.env.VITE_LOCAL_API_URL || 'http://localhost:5000')
  : (import.meta.env.VITE_API_URL || 'http://localhost:5000');

const api = axios.create({
  baseURL: `${backendURL}/api`,
  withCredentials: true
});

// Attach token from localStorage to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      const isLoginRequest = error.config.url.includes('/login');
      const isPublicPage = ['/', '/studentlogin', '/rootlogin', '/Home'].includes(window.location.pathname);
      if (!isLoginRequest && !isPublicPage) {
        localStorage.clear();
        window.location.href = '/Home';
      }
    }
    return Promise.reject(error);
  }
);

export { backendURL };
export default api;