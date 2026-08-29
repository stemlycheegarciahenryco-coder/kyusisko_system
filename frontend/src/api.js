import axios from 'axios';

const backendURL = import.meta.env.DEV 
  ? (import.meta.env.VITE_LOCAL_API_URL || 'http://localhost:5000')
  : (import.meta.env.VITE_API_URL || 'http://localhost:5000');

const api = axios.create({
  baseURL: `${backendURL}/api`,
  withCredentials: true
});

{/* Attach token from localStorage to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});*/}

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (status === 403) {
      console.warn(
        `[403 Forbidden] Access denied for endpoint: ${requestUrl}. Check if your account role has permission.`
      );
    }
    if (error.response && error.response.status === 401) {
      // ✅ FIXED: Checks for 'login' anywhere in the URL string safely (catches portal-login)
      const isLoginRequest = error.config.url.includes('login');
      
      // ✅ FIXED: Include your public pages
      const isPublicPage = ['/', '/Home', '/login'].includes(window.location.pathname);
      
      if (!isLoginRequest && !isPublicPage) {
        console.log("Wiping storage because 401 hit on non-public page:", window.location.pathname);
        localStorage.clear();
        window.location.href = '/Home';
      }
    }
    return Promise.reject(error);
  }
);

export { backendURL };
export default api;