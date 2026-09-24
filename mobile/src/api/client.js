import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

// Use your PC's local IP address — NOT localhost (that points to the phone itself).
// Find it by running: ipconfig   (Windows) → look for "IPv4 Address" e.g. 192.168.1.105

const API_URL = 'https://api.thinktrophy.com/api';
// const API_URL = 'http://10.236.176.146:4000/api';
// const API_URL = 'http://10.225.126.146:4000/api';

// 10.41.29.146
const client = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 25000,
});

const PUBLIC_PATHS = [
  '/auth/login',
  '/auth/register',
  '/auth/refresh',
  '/auth/forgot-password',
  '/auth/reset-password',
  '/auth/username-available',
  '/auth/verify-email',
  '/auth/resend-verification',
  '/auth/admin/',
  '/app/settings',
];

let onSessionExpired = null;
let sessionEnded = false;
let refreshPromise = null;

export function setSessionExpiredHandler(handler) {
  onSessionExpired = handler;
}

export function markSessionStarted() {
  sessionEnded = false;
}

function isPublicRequest(url) {
  const path = String(url || '');
  return PUBLIC_PATHS.some(part => path.includes(part));
}

async function deleteToken(key) {
  try { await SecureStore.deleteItemAsync(key); } catch { /* already gone */ }
}

async function endSession() {
  await deleteToken('access_token');
  await deleteToken('refresh_token');
  if (sessionEnded) return;
  sessionEnded = true;
  onSessionExpired?.();
}

async function refreshAccessToken() {
  if (refreshPromise) return refreshPromise;
  refreshPromise = (async () => {
    const refreshToken = await SecureStore.getItemAsync('refresh_token');
    if (!refreshToken) return null;
    const res = await axios.post(`${API_URL}/auth/refresh`, { refreshToken });
    const { accessToken, refreshToken: newRT } = res.data.data;
    await SecureStore.setItemAsync('access_token', accessToken);
    await SecureStore.setItemAsync('refresh_token', newRT);
    return accessToken;
  })().finally(() => { refreshPromise = null; });
  return refreshPromise;
}

function sessionExpiredError() {
  const error = new Error('Session expired');
  error.response = {
    status: 401,
    data: {
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'Your session expired. Please sign in again.' },
    },
  };
  return error;
}

client.interceptors.request.use(async config => {
  if (isPublicRequest(config.url)) return config;

  let token = null;
  try { token = await SecureStore.getItemAsync('access_token'); } catch { token = null; }

  if (!token) {
    try { token = await refreshAccessToken(); } catch { token = null; }
  }

  if (!token) {
    await endSession();
    return Promise.reject(sessionExpiredError());
  }

  config.headers.Authorization = `Bearer ${token}`;
  return config;
});

client.interceptors.response.use(
  res => res.data,
  async err => {
    const status = err.response?.status;
    const config = err.config;
    if (status === 401 && config && !isPublicRequest(config.url) && !config._retry) {
      config._retry = true;
      try {
        const accessToken = await refreshAccessToken();
        if (accessToken) {
          config.headers.Authorization = `Bearer ${accessToken}`;
          return client.request(config);
        }
      } catch { /* refresh token is no longer valid */ }
      await endSession();
      return Promise.reject(sessionExpiredError().response.data);
    }
    return Promise.reject(err.response?.data || err);
  }
);

export default client;
