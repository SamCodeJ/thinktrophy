import client from './client';

// Auth
export const adminLogin = (data) => client.post('/api/auth/admin/login', data);
export const adminForgotPassword = (data) => client.post('/api/auth/admin/forgot-password', data);
export const adminResetPassword = (data) => client.post('/api/auth/admin/reset-password', data);
export const adminUpdatePassword = (data) => client.post('/api/auth/admin/update-password', data);

// Dashboard
export const getDashboardStats = () => client.get('/api/admin/dashboard/stats');

// Statistics
export const getStatistics = (period) => client.get('/api/admin/statistics', { params: { period } });

// Questions
export const getQuestions = (params) => client.get('/api/admin/questions', { params });
export const createQuestion = (data) => client.post('/api/admin/questions', data);
export const updateQuestion = (id, data) => client.put(`/api/admin/questions/${id}`, data);
export const deleteQuestion = (id) => client.delete(`/api/admin/questions/${id}`);
export const bulkDeleteQuestions = (ids) => client.post('/api/admin/questions/bulk-delete', { ids });
export const bulkUploadQuestions = (formData) =>
  client.post('/api/admin/questions/bulk-upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

// Testimonials (landing page)
export const getTestimonials = () => client.get('/api/admin/testimonials');
export const createTestimonial = (data) => client.post('/api/admin/testimonials', data);
export const updateTestimonial = (id, data) => client.put(`/api/admin/testimonials/${id}`, data);
export const deleteTestimonial = (id) => client.delete(`/api/admin/testimonials/${id}`);

// Categories
export const getAdminCategories = () => client.get('/api/admin/categories');
export const createCategory = (data) => client.post('/api/admin/categories', data);
export const updateCategory = (id, data) => client.put(`/api/admin/categories/${id}`, data);
export const deleteCategory = (id) => client.delete(`/api/admin/categories/${id}`);
export const bulkDeleteCategories = (ids) => client.post('/api/admin/categories/bulk-delete', { ids });
export const getCategoryQuestions = (categoryId) =>
  client.get('/api/admin/questions', { params: { category_id: categoryId, limit: 9999, page: 1 } });

// Transactions
export const getTransactions = (params) => client.get('/api/admin/transactions', { params });
export const verifyDepositTransaction = (id, flwTransactionId) =>
  client.post(
    `/api/admin/transactions/${encodeURIComponent(id)}/verify`,
    flwTransactionId ? { flw_transaction_id: flwTransactionId } : {}
  );

// Users
export const getUsers = (params) => client.get('/api/admin/users', { params });
export const getUserDetail = (id) => client.get(`/api/admin/users/${id}`);
export const updateUserStatus = (id, data) => client.put(`/api/admin/users/${id}/status`, data);

// Game Sessions
export const getGameSessions = (params) => client.get('/api/admin/game-sessions', { params });
export const getGameSessionDetail = (id) => client.get(`/api/admin/game-sessions/${id}`);
export const correctGameSessionAnswer = (id, data) =>
  client.post(`/api/admin/game-sessions/${id}/correct-answer`, data);

// Settings
export const getSettings = () => client.get('/api/admin/settings');
export const updateSettings = (data) => client.put('/api/admin/settings', data);

// Logs
export const getAdminLogs = (params) => client.get('/api/admin/logs', { params });
export const getWebhookLogs = () => client.get('/api/admin/webhooks');
export const getOutboundJobs = (params) => client.get('/api/admin/outbound-jobs', { params });
export const retryOutboundJob = (id) => client.post(`/api/admin/outbound-jobs/${id}/retry`);

// Admins
export const getAdmins = () => client.get('/api/admin/admins');
export const createAdminAccount = (data) => client.post('/api/admin/admins', data);
export const updateAdminRole = (id, data) => client.put(`/api/admin/admins/${id}/role`, data);
