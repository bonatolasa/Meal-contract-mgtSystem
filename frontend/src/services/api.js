import axios from 'axios';

const LOCAL_API_ORIGIN = 'http://localhost:3000';
const DEPLOYED_API_ORIGIN = 'https://meal-contract-mgtsystem.onrender.com';
const DEFAULT_API_ORIGIN = import.meta.env.DEV ? LOCAL_API_ORIGIN : DEPLOYED_API_ORIGIN;
const configuredApiOrigin = import.meta.env.VITE_API_URL?.trim();
const isLocalApiOrigin = configuredApiOrigin && /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?\/?$/i.test(configuredApiOrigin);
const API_ORIGIN = (isLocalApiOrigin && !import.meta.env.DEV ? DEFAULT_API_ORIGIN : configuredApiOrigin || DEFAULT_API_ORIGIN)
  .replace(/\/api\/?$/i, '')
  .replace(/\/+$/, '');
const API_URL = `${API_ORIGIN}/api`;

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }

    // Local development prefers localhost, but can still use the deployed API
    // when the local backend is stopped or unreachable.
    const requestConfig = error.config;
    if (import.meta.env.DEV && requestConfig && !requestConfig._triedDeployedApi && (!error.response || error.code === 'ERR_NETWORK')) {
      requestConfig._triedDeployedApi = true;
      requestConfig.baseURL = `${DEPLOYED_API_ORIGIN}/api`;
      return api.request(requestConfig);
    }

    return Promise.reject(error);
  },
);

// Auth
export const loginUser = (email, password) => api.post('/auth/login', { email, password });
export const registerUser = (name, email, password, role, phone, address) => api.post('/auth/register', { name, email, password, role, phone, address });
export const getMe = () => api.get('/auth/me');

// Users
export const getUsers = () => api.get('/users');
export const createUser = (data) => api.post('/users', data);
export const updateUser = (id, data) => api.put(`/users/${id}`, data);
export const deleteUser = (id) => api.delete(`/users/${id}`);

// Customers
export const getCustomers = () => api.get('/customers');
export const getMyCustomer = () => api.get('/customers/me');
export const getCustomer = (id) => api.get(`/customers/${id}`);
export const createCustomer = (data) => api.post('/customers', data);
export const updateCustomer = (id, data) => api.put(`/customers/${id}`, data);
export const deleteCustomer = (id) => api.delete(`/customers/${id}`);

// Contracts
export const getContracts = () => api.get('/contracts');
export const getMealPackages = () => api.get('/contracts/packages');
export const createMealPackage = (data) => api.post('/contracts/packages', data);
export const updateMealPackage = (id, data) => api.put(`/contracts/packages/${id}`, data);
export const getContract = (id) => api.get(`/contracts/${id}`);
export const createContract = (data) => api.post('/contracts', data);
export const updateContract = (id, data) => api.put(`/contracts/${id}`, data);
export const deleteContract = (id) => api.delete(`/contracts/${id}`);
export const getActiveContracts = () => api.get('/contracts/status/active');
export const getExpiredContracts = () => api.get('/contracts/status/expired');
export const getCustomerContracts = (customerId) => api.get(`/contracts/customer/${customerId}`);
export const getMyContracts = () => api.get('/contracts/me');

// Meal Tracking
export const getTodayStats = () => api.get('/meal-tracking/stats/today');
export const getMyMealSelection = (date) => api.get(`/meal-tracking/me/selections?date=${date}`);
export const getMyMealSelectionHistory = () => api.get('/meal-tracking/me/selections/history');
export const submitMyMealSelection = (data) => api.put('/meal-tracking/me/selections', data);
export const getMealAttendance = (date, params = {}) => api.get(`/meal-tracking/selections/date/${date}`, { params });
export const getMealSummary = (date) => api.get(`/meal-tracking/summary/${date}`);
export const getMealServings = (date) => api.get(`/meal-tracking/servings/date/${date}`);
export const getMealServingSummary = (date) => api.get(`/meal-tracking/serving-summary/${date}`);
export const recordMealServing = (selectionId, mealType, status = 'SERVED', note = '') => api.post(`/meal-tracking/selections/${selectionId}/serve`, { mealType, status, note });
export const overrideMealSelection = (id, data) => api.patch(`/meal-tracking/selections/${id}/override`, data);
export const overrideCustomerMealSelection = (customerId, date, data) => api.patch(`/meal-tracking/selections/customer/${customerId}/date/${date}/override`, data);
export const getMenuItems = () => api.get('/meal-tracking/menu-items');
export const createMenuItem = (data) => api.post('/meal-tracking/menu-items', data);
export const updateMenuItem = (id, data) => api.patch(`/meal-tracking/menu-items/${id}`, data);
export const getDailyMenu = (date) => api.get('/meal-tracking/daily-menu', { params: { date } });
export const publishDailyMenu = (data) => api.post('/meal-tracking/daily-menu', data);
export const removeDailyMenuEntry = (id) => api.delete(`/meal-tracking/daily-menu/${id}`);
export const getMealSettings = () => api.get('/meal-tracking/settings');
export const updateMealSettings = (data) => api.put('/meal-tracking/settings', data);

// Payments
export const createPayment = (data) => api.post('/payments', data);
export const reversePayment = (id, note) => api.post(`/payments/${id}/reverse`, { note });
export const getPayments = () => api.get('/payments');
export const getPaymentsByContract = (contractId) => api.get(`/payments/contract/${contractId}`);
export const getPaymentsByCustomer = (customerId) => api.get(`/payments/customer/${customerId}`);
export const getMyPayments = () => api.get('/payments/me');
export const getOutstandingPayments = () => api.get('/payments/outstanding');

// Reports
export const generateDailyReport = (date, generatedBy) => api.post('/reports/daily', { date, generatedBy });
export const generateWeeklyReport = (startDate, endDate, generatedBy) => api.post('/reports/weekly', { startDate, endDate, generatedBy });
export const generateMonthlyReport = (month, year, generatedBy) => api.post('/reports/monthly', { month, year, generatedBy });
export const getReports = () => api.get('/reports');

// Notifications
export const createNotification = (data) => api.post('/notifications', data);
export const getNotifications = () => api.get('/notifications');
export const getMyNotifications = () => api.get('/notifications/me');
export const getUnreadNotifications = () => api.get('/notifications/unread');
export const markNotificationRead = (id) => api.put(`/notifications/${id}/read`);
export const markMyNotificationRead = (id) => api.put(`/notifications/me/${id}/read`);
export const deleteNotification = (id) => api.delete(`/notifications/${id}`);
