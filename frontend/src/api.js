import axios from 'axios';

export const backendURL = 'http://localhost:5000'; 

const api = axios.create({
  baseURL: `${backendURL}/api`, 
  withCredentials: true 
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Check if the error is 401
    if (error.response && error.response.status === 401) {
      
      // FIX: Don't redirect if the user is ALREADY on a login or home page
      // or if the request was specifically to a login endpoint.
      const isLoginRequest = error.config.url.includes('/login');
      const isPublicPage = ['/', '/studentlogin','/rootlogin' ,'/Home'].includes(window.location.pathname);

      if (!isLoginRequest && !isPublicPage) {
        localStorage.clear();
        window.location.href = '/Home'; 
      }
    }
    return Promise.reject(error);
  }
);

export default api;