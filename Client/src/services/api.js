import axios from 'axios';

// Resolve API base URL dynamically from environment or fallback
const getBaseURL = () => {
  // If running locally on browser localhost / 127.0.0.1, target local backend port 5000
  if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
    const envUrl = import.meta.env.VITE_API_URL;
    if (envUrl && envUrl.includes('localhost')) {
      return envUrl.endsWith('/') ? envUrl.slice(0, -1) : envUrl;
    }
    return 'http://localhost:5000/api';
  }

  const envUrl = import.meta.env.VITE_API_URL;
  if (envUrl && envUrl.trim() !== '') {
    return envUrl.endsWith('/') ? envUrl.slice(0, -1) : envUrl;
  }
  
  return 'https://leetpluse.onrender.com/api';
};


const api = axios.create({
  baseURL: getBaseURL(),
  headers: {
    'Content-Type': 'application/json'
  }
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  const impersonateId = localStorage.getItem('impersonateUserId');
  if (impersonateId) {
    config.headers['X-Impersonate-User-Id'] = impersonateId;
  }

  return config;
}, (error) => Promise.reject(error));

export default api;

