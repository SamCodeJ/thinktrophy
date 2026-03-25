import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

// Use your PC's local IP address — NOT localhost (that points to the phone itself).
// Find it by running: ipconfig   (Windows) → look for "IPv4 Address" e.g. 192.168.1.105

const API_URL = 'http://187.124.168.199:4000/api';
// const API_URL = 'http://10.189.225.146:4000/api';

// 10.41.29.146
const client = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

client.interceptors.request.use(async config => {
  const token = await SecureStore.getItemAsync('access_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

client.interceptors.response.use(
  res => res.data,
  async err => {
    if (err.response?.status === 401) {
      // Try refresh
      try {
        const refreshToken = await SecureStore.getItemAsync('refresh_token');
        if (refreshToken) {
          const res = await axios.post(`${API_URL}/auth/refresh`, { refreshToken });
          const { accessToken, refreshToken: newRT } = res.data.data;
          await SecureStore.setItemAsync('access_token', accessToken);
          await SecureStore.setItemAsync('refresh_token', newRT);
          err.config.headers.Authorization = `Bearer ${accessToken}`;
          return client.request(err.config);
        }
      } catch {
        await SecureStore.deleteItemAsync('access_token');
        await SecureStore.deleteItemAsync('refresh_token');
      }
    }
    return Promise.reject(err.response?.data || err);
  }
);

export default client;
