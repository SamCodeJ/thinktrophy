import axios from 'axios';

/**
 * - Leave VITE_API_URL unset: requests use relative `/api/...` (Vite dev/preview proxy → backend).
 * - Set VITE_API_URL to API origin only, e.g. `http://localhost:4000` (no trailing /api).
 */
const client = axios.create({
  baseURL: import.meta.env.VITE_API_URL?.replace(/\/$/, '') ?? '',
  headers: { 'Content-Type': 'application/json' },
});

client.interceptors.request.use(config => {
  const token = localStorage.getItem('admin_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

client.interceptors.response.use(
  res => res.data,
  err => {
    if (err.response?.status === 401 && !window.location.pathname.includes('/login')) {
      localStorage.removeItem('admin_token');
      localStorage.removeItem('admin_info');
      window.location.replace('/login');
    }
    return Promise.reject(err.response?.data || err);
  }
);

export default client;
