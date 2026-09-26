import axios from 'axios';

let rawUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
rawUrl = rawUrl.replace(/\/+$/, '');
if (!rawUrl.endsWith('/api') && !rawUrl.endsWith('/api/v1')) {
  rawUrl = `${rawUrl}/api`;
}

const apiClient = axios.create({
  baseURL: rawUrl,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Attach Authorization header if token is stored in localStorage
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Intercept 401 Unauthorized responses to clear stale sessions
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      const currentPath = window.location.pathname;
      if (currentPath !== '/login') {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('tenant');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;
