import client from './client';

// Auth
export const register       = (data) => client.post('/auth/register', data);
export const login          = (data) => client.post('/auth/login', data);
export const refreshTokens  = (refreshToken) => client.post('/auth/refresh', { refreshToken });
export const logout         = () => client.post('/auth/logout');

// User
export const getProfile     = () => client.get('/user/profile');
export const getWallet      = () => client.get('/user/wallet');
export const getGameHistory = () => client.get('/user/history');
export const getLeaderboard = (period = 'weekly') => client.get(`/user/leaderboard?period=${period}`);

// Payment
export const deposit        = (data) => client.post('/payment/deposit', data);
export const verifyPayment  = (reference) => client.post(`/payment/verify/${reference}`);
export const withdraw       = (data) => client.post('/payment/withdraw', data);

// Public app settings (no auth required)
export const getPublicSettings   = () => client.get('/app/settings');

// Game
export const getCategories       = () => client.get('/game/categories');
export const createGameSession   = (data) => client.post('/game/session/create', data);
export const submitAnswer        = (sessionId, data) => client.post(`/game/session/${sessionId}/answer`, data);
export const getSessionResult    = (sessionId) => client.get(`/game/session/${sessionId}/result`);
export const abandonSession      = (sessionId) => client.post(`/game/session/${sessionId}/abandon`);
