import client from './client';

// Auth
export const adminLogin = (data) => client.post('/auth/admin/login', data);

// Dashboard
export const getDashboardStats = () => client.get('/admin/dashboard/stats');

// Statistics
export const getStatistics = (period) => client.get('/admin/statistics', { params: { period } });

// Questions
export const getQuestions = (params) => client.get('/admin/questions', { params });
export const createQuestion = (data) => client.post('/admin/questions', data);
export const updateQuestion = (id, data) => client.put(`/admin/questions/${id}`, data);
export const deleteQuestion = (id) => client.delete(`/admin/questions/${id}`);
export const bulkDeleteQuestions = (ids) => client.post('/admin/questions/bulk-delete', { ids });
export const bulkUploadQuestions = (formData) =>
  client.post('/admin/questions/bulk-upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

// Categories
export const getAdminCategories = () => client.get('/admin/categories');
export const createCategory = (data) => client.post('/admin/categories', data);
export const updateCategory = (id, data) => client.put(`/admin/categories/${id}`, data);
export const deleteCategory = (id) => client.delete(`/admin/categories/${id}`);
export const bulkDeleteCategories = (ids) => client.post('/admin/categories/bulk-delete', { ids });
export const getCategoryQuestions = (categoryId) =>
  client.get('/admin/questions', { params: { category_id: categoryId, limit: 9999, page: 1 } });

// Transactions
export const getTransactions = (params) => client.get('/admin/transactions', { params });

// Users
export const getUsers = (params) => client.get('/admin/users', { params });
export const getUserDetail = (id) => client.get(`/admin/users/${id}`);
export const updateUserStatus = (id, data) => client.put(`/admin/users/${id}/status`, data);

// Game Sessions
export const getGameSessions = (params) => client.get('/admin/game-sessions', { params });
export const getGameSessionDetail = (id) => client.get(`/admin/game-sessions/${id}`);

// Settings
export const getSettings = () => client.get('/admin/settings');
export const updateSettings = (data) => client.put('/admin/settings', data);

// Logs
export const getAdminLogs = (params) => client.get('/admin/logs', { params });

// Admins
export const getAdmins = () => client.get('/admin/admins');
export const createAdminAccount = (data) => client.post('/admin/admins', data);
export const updateAdminRole = (id, data) => client.put(`/admin/admins/${id}/role`, data);
