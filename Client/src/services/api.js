import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
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
